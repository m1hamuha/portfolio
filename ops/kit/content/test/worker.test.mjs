/* Worker and app-token tests: fake fetch for Anthropic, fake KV, no network. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import worker, { sha256hex, auth } from "../worker/src/index.js";
import { newToken, hash, workerEntry, buildClients } from "../bin/app-token.mjs";
import { T } from "../app/i18n.js";

const here = dirname(fileURLToPath(import.meta.url));
const example = JSON.parse(await readFile(join(here, "../clients/salon-lila.example.json"), "utf8"));
const TOKEN = newToken();
const entry = workerEntry({ ...example, app: { ...example.app, token_sha256: hash(TOKEN), daily_limit: 2 } });

function kv() {
  const m = new Map();
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) };
}
const envOf = (extra = {}) => ({ CLIENTS: JSON.stringify([entry]), ANTHROPIC_API_KEY: "test-key", USAGE: kv(), ...extra });
const req = (path, { method = "GET", token = TOKEN, body } = {}) =>
  new Request(`https://app.example/${path.replace(/^\//, "")}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
const IMG = { media_type: "image/jpeg", data: "/9j/4AAQSkZJRgABAQ==" };

function fakeAnthropic(replyCaption) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { ok: true, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ caption: replyCaption, status_text: "x", alt: "Nägel", hashtags: ["#nägelleipzig"] }) }] }) };
  };
  return { f, calls };
}

test("token hashing matches node and webcrypto", async () => {
  assert.equal(await sha256hex("abc"), hash("abc"));
  assert.ok(TOKEN.length >= 30);
  assert.throws(() => workerEntry({ id: "x", app: {} }), /token_sha256/);
  assert.equal(entry.facts.prices["Maniküre mit Gel"], "35 €");
  assert.ok(!("contact" in entry));
});

test("auth: wrong or missing token is 401", async () => {
  const env = envOf();
  assert.equal((await worker.fetch(req("/api/me", { token: "x".repeat(32) }), env)).status, 401);
  assert.equal((await worker.fetch(req("/api/me", { token: null }), env)).status, 401);
  assert.equal((await worker.fetch(req("/api/me"), { ...env, CLIENTS: "not json" })).status, 401);
  assert.equal((await auth(req("/api/me"), env)).id, "salon-lila");
});

test("me and caption, then daily limit", async () => {
  const env = envOf();
  const me = await (await worker.fetch(req("/api/me"), env)).json();
  assert.deepEqual(me, { name: "Nagelstudio Lila", niche: "salon", ui_language: "ru", used: 0, daily_limit: 2 });
  const { f, calls } = fakeAnthropic("Nude mit Goldlinien.");
  const r = await worker.fetch(req("/api/caption", { method: "POST", body: { images: [IMG, IMG, IMG, IMG], note: "Nude mit Gold" } }), env, {}, f);
  assert.equal(r.status, 200);
  const cap = await r.json();
  assert.equal(cap.caption, "Nude mit Goldlinien.");
  assert.deepEqual(cap.problems, []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages");
  assert.equal(calls[0].body.model, "claude-haiku-5-5");
  assert.equal(calls[0].headers["x-api-key"], "test-key");
  assert.equal(calls[0].body.messages[0].content.filter((b) => b.type === "image").length, 3);
  await worker.fetch(req("/api/caption", { method: "POST", body: { images: [IMG] } }), env, {}, f);
  const third = await worker.fetch(req("/api/caption", { method: "POST", body: { images: [IMG] } }), env, {}, f);
  assert.equal(third.status, 429);
  assert.equal(calls.length, 2);
});

test("bad input is refused before any model call", async () => {
  const env = envOf();
  const { f, calls } = fakeAnthropic("x");
  for (const body of [{}, { images: [] }, { images: [{ media_type: "image/gif", data: "AAAA" }] }, { images: [{ media_type: "image/jpeg", data: "<script>" }] }, { images: [{ media_type: "image/jpeg", data: "A".repeat(1_700_000) }] }]) {
    assert.equal((await worker.fetch(req("/api/caption", { method: "POST", body }), env, {}, f)).status, 400);
  }
  const bad = new Request("https://app.example/api/caption", { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: "{" });
  assert.equal((await worker.fetch(bad, env, {}, f)).status, 400);
  assert.equal(calls.length, 0);
});

test("model failure is 502 and not counted; invented price is flagged", async () => {
  const env = envOf();
  const down = async () => ({ ok: false, status: 529, text: async () => "overloaded" });
  assert.equal((await worker.fetch(req("/api/caption", { method: "POST", body: { images: [IMG] } }), env, {}, down)).status, 502);
  assert.equal(env.USAGE.m.size, 0);
  const { f } = fakeAnthropic("Nur heute 29 €!");
  const cap = await (await worker.fetch(req("/api/caption", { method: "POST", body: { images: [IMG] } }), env, {}, f)).json();
  assert.ok(cap.problems.some((p) => p.includes("price 29")));
});

test("non-API paths go to static assets", async () => {
  const env = envOf({ ASSETS: { fetch: async () => new Response("app") } });
  assert.equal(await (await worker.fetch(req("/index.html", { token: null }), env)).text(), "app");
  assert.equal((await worker.fetch(req("/api/nope"), envOf())).status, 404);
});

test("CLIENTS builder skips examples unless asked", async () => {
  assert.deepEqual(await buildClients(join(here, "../clients")), []);
  await assert.rejects(buildClients(join(here, "../clients"), true), /token_sha256 missing/);
});

test("app texts: 4 languages, same keys, no long dashes; app files clean", async () => {
  const keys = Object.keys(T.ru).sort();
  for (const l of ["uk", "de", "en"]) assert.deepEqual(Object.keys(T[l]).sort(), keys, l);
  for (const l of Object.keys(T)) for (const v of Object.values(T[l])) assert.ok(!/[\u2013\u2014]/.test(v));
  for (const f of await readdir(join(here, "../app"))) assert.ok(!/[\u2013\u2014]/.test(await readFile(join(here, "../app", f), "utf8")), f);
});
