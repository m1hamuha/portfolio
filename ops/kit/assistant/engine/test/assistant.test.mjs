import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ask, systemBlocks, numbersBacked, MAX_KB_CHARS } from "../src/kb.js";
import worker, { handleAsk } from "../src/index.js";
import { makeLLM } from "../../../bot/engine/src/llm.js";
import { runEval } from "../../eval/run-eval.mjs";
import { instructions, rulesMarkdown } from "../../gem/build-gem.mjs";

const load = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const office = load("../../kb/office-steuer.json");
const cleaning = load("../../kb/cleaning-blitz.json");
const mock = (fn) => makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLIES: fn });
const J = (o) => JSON.stringify(o);

test("answer from the price list carries its source and page", async () => {
  const r = await ask(office, "Payroll for 3 staff?", { llm: mock(() => J({ lang: "en", found: true, answer: "Payroll, up to 5 staff: 90 EUR a month.", sources: ["p2"] })) });
  assert.equal(r.found, true);
  assert.deepEqual(r.sources, ["Preisliste 2026, p. 2: Payroll and bookkeeping"]);
});

test("invented numbers or missing sources become 'ask the owner', and the question is logged", async () => {
  const logged = [];
  const log = async (q) => logged.push(q);
  const r1 = await ask(office, "Payroll for 3 staff?", { llm: mock(() => J({ lang: "en", found: true, answer: "It is 70 EUR a month.", sources: ["p2"] })), log });
  assert.equal(r1.found, false);
  const r2 = await ask(office, "WLAN?", { llm: mock(() => J({ lang: "de", found: true, answer: "Das Passwort ist am Router.", sources: [] })), log });
  assert.equal(r2.found, false);
  assert.match(r2.answer, /die Chefin/);
  const r3 = await ask(cleaning, "Сколько мне платят?", { llm: mock(() => "no json at all"), log });
  assert.match(r3.answer, /Спросите, пожалуйста, начальника/);
  assert.equal(logged.length, 3);
  assert.ok(numbersBacked("Krankmeldung bis 8:30 Uhr, Attest ab dem 3. Tag.", office, ["r4"]));
});

test("whole rule book goes to the model with prompt caching (mocked HTTP)", async () => {
  let sent;
  const f = async (url, init) => { sent = JSON.parse(init.body); return new Response(J({ content: [{ type: "text", text: J({ lang: "ru", found: true, answer: "Только если в заказе генеральная. Стекло: синяя тряпка.", sources: ["c1"] }) }] })); };
  const r = await ask(cleaning, "Духовку внутри?", { llm: makeLLM({ ANTHROPIC_API_KEY: "k" }, f) });
  assert.equal(r.found, true);
  assert.equal(sent.system[0].cache_control.type, "ephemeral");
  for (const s of cleaning.sections) assert.ok(sent.system[0].text.includes(s.text));
  assert.equal(sent.model, "claude-haiku-5-5");
});

test("rule books over the size limit are refused (use NotebookLM)", () => {
  const big = { ...office, sections: [{ id: "x", source: "s", title: "t", text: "a".repeat(MAX_KB_CHARS + 1) }] };
  assert.throws(() => systemBlocks(big));
});

test("30-question eval runs end to end with a simulated perfect model", async () => {
  const set = load("../../eval/office-steuer.json");
  assert.equal(set.questions.length, 30);
  const byQ = Object.fromEntries(set.questions.map((x) => [x.q, x.expect]));
  const perfect = mock((system, messages) => {
    const ids = byQ[messages[0].content];
    if (!ids.length) return J({ lang: "de", found: false, answer: "", sources: [] });
    return J({ lang: "de", found: true, answer: "Siehe Regel.", sources: ids });
  });
  const out = await runEval(office, set, perfect);
  assert.equal(out.pass, 30);
  const lazy = mock(() => J({ lang: "de", found: true, answer: "Siehe Regel.", sources: ["p1"] }));
  assert.ok((await runEval(office, set, lazy)).pass < 10);
});

test("Worker: team code required, unanswered list for the owner only", async () => {
  const m = new Map();
  const env = { KB_ID: "office-steuer", TEAM_CODE: "team-1234", OWNER_CODE: "owner-5678", LLM_PROVIDER: "mock", MOCK_REPLIES: () => J({ found: false }),
    CHATS: { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), delete: async (k) => void m.delete(k) } };
  const post = (b) => new Request("https://h.test/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: J(b) });
  assert.equal((await handleAsk(post({ code: "nope", q: "x" }), env)).status, 401);
  const r = await (await handleAsk(post({ code: "team-1234", q: "Wo ist das WLAN-Passwort?" }), env)).json();
  assert.equal(r.found, false);
  assert.equal((await worker.fetch(new Request("https://h.test/unanswered?code=team-1234"), env)).status, 401);
  const u = await (await worker.fetch(new Request("https://h.test/unanswered?code=owner-5678"), env)).json();
  assert.equal(u.questions[0].q, "Wo ist das WLAN-Passwort?");
});

test("Gem / NotebookLM pack: instructions and rules file", () => {
  const ins = instructions(cleaning);
  assert.match(ins, /ONLY from the attached file "rules-cleaning-blitz.md"/);
  assert.match(rulesMarkdown(cleaning), /## Küche \(Regeln\)/);
  assert.ok(!/[\u2013\u2014]/.test(ins + rulesMarkdown(cleaning) + rulesMarkdown(office)));
});
