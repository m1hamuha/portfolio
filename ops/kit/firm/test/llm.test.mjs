import test from "node:test";
import assert from "node:assert/strict";
import { makeLLM, redact } from "../lib/llm.mjs";

function fakeFetch(replies) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const r = replies[Math.min(calls.length - 1, replies.length - 1)];
    return { ok: r.status === 200, status: r.status, json: async () => r.json, text: async () => JSON.stringify(r.json || {}) };
  };
  fn.calls = calls;
  return fn;
}
const ANT = { LLM_PROVIDER: "anthropic", LLM_ALLOW_NON_EU: "yes", ANTHROPIC_API_KEY: "k" };
const OK = { status: 200, json: { content: [{ type: "text", text: "Hallo" }] } };

test("anthropic: headers, model, body", async () => {
  const f = fakeFetch([OK]);
  const llm = makeLLM({ LLM_PROVIDER: "anthropic", LLM_ALLOW_NON_EU: "yes", ANTHROPIC_API_KEY: "test-key" }, f);
  assert.equal(await llm.complete({ system: "s", user: "u" }), "Hallo");
  const c = f.calls[0];
  assert.equal(c.url, "https://api.anthropic.com/v1/messages");
  assert.equal(c.init.headers["x-api-key"], "test-key");
  assert.equal(c.body.model, "claude-haiku-5-5");
  assert.deepEqual(c.body.messages, [{ role: "user", content: "u" }]);
});

test("bedrock-eu: EU endpoint, eu.* profile, bearer key", async () => {
  const f = fakeFetch([OK]);
  const llm = makeLLM({ LLM_PROVIDER: "bedrock-eu", AWS_BEARER_TOKEN_BEDROCK: "bk", LLM_MODEL: "claude-sonnet-5-5" }, f);
  assert.equal(await llm.complete({ system: "s", user: "u" }), "Hallo");
  const c = f.calls[0];
  assert.match(c.url, /^https:\/\/bedrock-runtime\.eu-central-1\.amazonaws\.com\/model\/eu\.anthropic\.claude-sonnet-5-5\/invoke$/);
  assert.equal(c.init.headers.authorization, "Bearer bk");
  assert.equal(c.body.anthropic_version, "bedrock-2023-05-31");
  assert.equal(c.body.model, undefined);
});

test("bedrock-eu refuses non-EU region and non-EU profile", () => {
  assert.throws(() => makeLLM({ LLM_PROVIDER: "bedrock-eu", AWS_BEARER_TOKEN_BEDROCK: "k", AWS_REGION: "us-east-1" }), /EU region/);
  assert.throws(() => makeLLM({ LLM_PROVIDER: "bedrock-eu", AWS_BEARER_TOKEN_BEDROCK: "k", BEDROCK_MODEL_ID: "global.anthropic.claude-sonnet-5-5" }), /EU inference profile/);
});

test("retries on 529, fails fast on 400", async () => {
  const f = fakeFetch([{ status: 529, json: {} }, OK]);
  assert.equal(await makeLLM(ANT, f).complete({ user: "x" }), "Hallo");
  assert.equal(f.calls.length, 2);
  const g = fakeFetch([{ status: 400, json: { error: "bad" } }, OK]);
  await assert.rejects(makeLLM(ANT, g).complete({ user: "x" }), /400/);
  assert.equal(g.calls.length, 1);
});

test("missing key and unknown provider throw", () => {
  assert.throws(() => makeLLM({}), /AWS_BEARER_TOKEN_BEDROCK/);
  assert.throws(() => makeLLM({ LLM_PROVIDER: "anthropic", LLM_ALLOW_NON_EU: "yes" }), /ANTHROPIC_API_KEY/);
  assert.throws(() => makeLLM({ LLM_PROVIDER: "x" }), /unknown/);
});

test("mock provider", async () => {
  const llm = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: (r) => r.user.toUpperCase() });
  assert.equal(await llm.complete({ user: "abc" }), "ABC");
});

test("redact removes IBAN, email, phone, tax id", () => {
  const t = "Bitte an DE89 3704 0044 0532 0130 00 zahlen, Rückfragen max.muster@example.de oder +49 30 1234567, Steuernummer 12/345/67890. Betrag 1.234,50 EUR am 03.11.2026";
  const r = redact(t);
  assert.ok(!/DE89|example\.de|1234567|67890/.test(r), r);
  assert.match(r, /\[IBAN\].*\[EMAIL\].*\[PHONE\].*\[TAXID\]/);
  assert.match(r, /1\.234,50 EUR am 03\.11\.2026/);
});

test("default is EU; anthropic only with explicit non-EU consent", async () => {
  const f = fakeFetch([OK]);
  const llm = makeLLM({ AWS_BEARER_TOKEN_BEDROCK: "bk" }, f);
  assert.equal(llm.provider, "bedrock-eu");
  await llm.complete({ user: "u" });
  assert.match(f.calls[0].url, /bedrock-runtime\.eu-central-1/);
  assert.throws(() => makeLLM({ LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" }), /outside the EU/);
});
