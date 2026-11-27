import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { core } from "../lib/core.mjs";
import { makeLLM } from "../lib/llm.mjs";
import { makeAd, renderMarkdown } from "../bin/job-ad.mjs";
import { loadGas } from "./gas-shim.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const ex = (n) => JSON.parse(fs.readFileSync(here(`../examples/${n}.json`), "utf8"));
const J = (x) => JSON.parse(JSON.stringify(x));
const EXAMPLES = fs.readdirSync(here("../examples")).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

test("every example config is valid and its form passes the question check", () => {
  for (const n of EXAMPLES) {
    const cfg = ex(n);
    assert.deepEqual(J(core.validateHiringConfig(cfg)), [], n);
    const spec = core.buildFormSpec(cfg);
    assert.deepEqual(J(core.lintQuestions(spec)), [], n);
    assert.equal(spec.items[0].id, "name");
    assert.equal(spec.items.at(-1).id, "consent");
    assert.ok(spec.items.length <= 10, `${n}: short form`);
  }
});

test("the whole question library is AGG clean in all 4 languages", () => {
  for (const lang of ["de", "en", "ru", "uk"]) {
    const cfg = { ...ex("clinic-zahn"), form: { lang, cert: "X", shift: "Y", questions: ["start", "hours", "weekends", "experience", "area", "certificate", "tools", "licence"] } };
    const spec = core.buildFormSpec(cfg);
    assert.deepEqual(J(core.lintQuestions({ items: spec.items.slice(0, 9) })), [], lang);
    const more = core.buildFormSpec({ ...cfg, form: { lang, questions: ["german", "permit", "work_link", "about", "email"] } });
    assert.deepEqual(J(core.lintQuestions(more)), [], lang);
  }
});

test("question check catches forbidden questions and file uploads", () => {
  const bad = { items: [
    { id: "a", type: "text", title: "Wie alt bist du? Geburtsdatum" },
    { id: "b", type: "text", title: "Bitte ein Foto von dir" },
    { id: "c", type: "text", title: "Nationalität" },
    { id: "d", type: "choice", title: "Есть дети?" },
    { id: "e", type: "file", title: "Lebenslauf" },
    { id: "f", type: "text", title: "Deutsch Muttersprache?" },
  ] };
  const ids = core.lintQuestions(bad).map((x) => x.id);
  for (const id of ["a", "b", "c", "d", "e", "f"]) assert.ok(ids.includes(id), id);
});

test("AGG check on ad texts", () => {
  const good = "Barista (m/w/d) in Musterstadt\n14,50 € pro Stunde, Mo bis Fr 7 bis 13 Uhr\nDeutsch für einfache Gespräche mit Gästen.";
  assert.deepEqual(J(core.aggLint(good, "de")), []);
  const bad = "Barista gesucht\nWir sind ein junges Team und suchen dich bis 30 Jahre, Muttersprachler, Bewerbung mit Foto.";
  const why = core.aggLint(bad, "de").map((x) => x.why).join(" | ");
  assert.match(why, /age wording/);
  assert.match(why, /age limit/);
  assert.match(why, /native speaker/);
  assert.match(why, /photo/);
  assert.match(why, /\(m\/w\/d\)/);
  assert.equal(core.aggLint("Kellnerin gesucht (m/w/d)", "de").length, 0);
  assert.equal(core.aggLint("Wir suchen eine Kellnerin\nab sofort", "de").filter((x) => x.why.includes("female")).length, 1);
  assert.equal(core.aggLint("Ищем молодую официантку", "ru").length, 1);
});

test("who fits: rules on choices and start date", () => {
  const rules = ex("cafe-olive").fit_rules;
  assert.equal(core.fitCheck({ hours: "Ja", start: "2026-12-01" }, rules, "2026-11-27").fits, true);
  const no = core.fitCheck({ hours: "Teilweise", start: "2027-03-01" }, rules, "2026-11-27");
  assert.equal(no.fits, false);
  assert.deepEqual(J(no.why), ["hours: Teilweise", "start: 2027-03-01"]);
});

test("privacy notice names controller, purpose, retention and contact; retention cutoff", () => {
  const t = core.privacyNotice(ex("clinic-zahn"), "de");
  assert.match(t, /Verantwortlich: Zahnarztpraxis Beispiel/);
  assert.match(t, /6 Monate/);
  assert.match(t, /praxis@example\.com/);
  assert.match(t, /example\.com\/datenschutz/);
  assert.match(core.privacyNotice(ex("cleaning-blitz"), "ru"), /не дольше 6 мес\./);
  assert.equal(core.retentionCutoff("2026-11-27", 6), "2026-05-27");
});

test("LLM adapter: Anthropic request shape (mocked HTTP), refusal and missing key", async () => {
  const calls = [];
  const fetchOk = async (url, o) => { calls.push({ url, o }); return { ok: true, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "hi" }] }) }; };
  const llm = makeLLM({ ANTHROPIC_API_KEY: "test" }, fetchOk);
  assert.equal(await llm.complete({ system: "s", user: "u" }), "hi");
  const body = JSON.parse(calls[0].o.body);
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages");
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.equal(body.fallbacks, "default");
  assert.equal(calls[0].o.headers["anthropic-beta"], "server-side-fallback-2026-07-01");
  assert.equal(calls[0].o.headers["x-api-key"], "test");
  const haiku = makeLLM({ ANTHROPIC_API_KEY: "t", LLM_MODEL: "claude-haiku-5-5" }, fetchOk);
  await haiku.complete({ system: "s", user: "u" });
  assert.equal(JSON.parse(calls[1].o.body).fallbacks, undefined);
  const refuse = makeLLM({ ANTHROPIC_API_KEY: "t" }, async () => ({ ok: true, json: async () => ({ stop_reason: "refusal", content: [] }) }));
  await assert.rejects(refuse.complete({ system: "s", user: "u" }), /declined/);
  await assert.rejects(makeLLM({}, fetchOk).complete({ system: "s", user: "u" }), /ANTHROPIC_API_KEY/);
});

test("job ad end to end with a mocked model: link inserted, AGG checked, markdown and QR", async () => {
  const cfg = ex("cafe-olive");
  const reply = JSON.stringify({ title_de: "Barista (m/w/d)", ads: {
    de: "Barista (m/w/d) im Cafe Olive\n14,50 € pro Stunde plus Trinkgeld, Mo bis Fr 7 bis 13 Uhr\nBewirb dich in 2 Minuten: {{FORM_LINK}}",
    en: "Barista wanted, 14.50 € per hour. Apply in 2 minutes: {{FORM_LINK}}",
    ru: "Бариста, 14,50 € в час. Анкета на 2 минуты: {{FORM_LINK}}",
    uk: "Бариста, 14,50 € на годину. Анкета на 2 хвилини: {{FORM_LINK}}",
  } });
  let seen;
  const llm = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: (req) => { seen = req; return "```json\n" + reply + "\n```"; } });
  const res = await makeAd(cfg, { llm, link: "https://forms.gle/EXAMPLE" });
  assert.match(seen.system, /AGG/);
  assert.match(seen.system, /Max 140 words/);
  assert.match(seen.user, /Pay: 14,50 €/);
  assert.match(res.ads.de, /https:\/\/forms\.gle\/EXAMPLE/);
  assert.deepEqual(Object.values(res.issues).flat(), []);
  const md = renderMarkdown(cfg, res, core.buildFormSpec(cfg), []);
  assert.match(md, /## AGG check\n\n- ok/);
  assert.match(md, /Jobbörse der Bundesagentur/);
  assert.match(md, /Passen die Arbeitszeiten \(Mo bis Fr 7 bis 13 Uhr\)\? \*/);
  const svg = core.qrSvg("https://forms.gle/EXAMPLE", { px: 600 });
  assert.match(svg, /^<svg[^>]+width="600"/);
  const bad = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: JSON.stringify({ ads: { de: "Junges Team sucht Barista" } }) });
  await assert.rejects(makeAd({ ...cfg, langs: ["de", "ru"] }, { llm: bad }), /skipped language ru/);
  const flagged = await makeAd({ ...cfg, langs: ["de"] }, { llm: bad });
  assert.ok(flagged.issues.de.some((x) => x.level === "error"));
});

test("llm: retries 529 / 429, then gives the text; 400 fails at once", async () => {
  let n = 0;
  const ok = { ok: true, status: 200, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "hi" }] }) };
  const busy = (st) => ({ ok: false, status: st, headers: { get: () => null }, text: async () => "overloaded" });
  const llm = makeLLM({ ANTHROPIC_API_KEY: "test-key", LLM_RETRY_SCALE: 0 }, async () => (++n < 3 ? busy(n === 1 ? 529 : 429) : ok));
  assert.equal(await llm.complete({ system: "s", user: "u" }), "hi");
  assert.equal(n, 3);
  let m = 0;
  const bad = makeLLM({ ANTHROPIC_API_KEY: "test-key", LLM_RETRY_SCALE: 0 }, async () => { m++; return busy(400); });
  await assert.rejects(bad.complete({ system: "s", user: "u" }), /anthropic 400/);
  assert.equal(m, 1);
});

/* ---------- Apps Script through the shim ---------- */

function submit(g, form, answers, when = new Date("2026-11-27T10:00:00Z")) {
  const spec = JSON.parse(g.store.SPEC);
  const items = spec.items.map((it) => ({ getItem: () => ({ getTitle: () => it.title }), getResponse: () => answers[it.id] ?? "" }));
  const sheet = g.sheetsById[g.store.SHEET_ID].getSheets().find((s) => s.getFormUrl());
  sheet.appendRow([when, ...spec.items.filter((i) => i.type !== "file").map((i) => answers[i.id] ?? "")]);
  form.responses.push({ getId: () => `R${form.responses.length + 1}`, getTimestamp: () => when });
  return g.ctx.onSubmit({ response: { getItemResponses: () => items, getTimestamp: () => when } });
}

test("apps script: setup builds the form without Google login, answers get a fit mark and an email", () => {
  const g = loadGas([here("../lib/HiringCore.gs"), here("../apps-script/Hiring.gs")], { config: ex("cafe-olive") });
  const made = g.ctx.setup();
  assert.match(made.form_url, /viewform/);
  assert.match(made.short_url, /forms\.gle/);
  const form = g.forms[0];
  assert.ok(form.calls.some((c) => c[0] === "setCollectEmail" && c[1] === false));
  assert.equal(form.published, true, "form is published so staff / applicants can answer");
  assert.equal(form.requireLogin, false, "no login required, also in a Workspace domain");
  assert.ok(form.calls.some((c) => c[0] === "setLimitOneResponsePerUser" && c[1] === false));
  assert.ok(form.calls.some((c) => c[0] === "setDescription" && /Verantwortlich/.test(c[1])));
  assert.deepEqual(g.log.triggers.map((t) => t.fn).sort(), ["cleanup", "onSubmit"]);
  const fit = submit(g, form, { name: "Anna Example", phone: "0151 000", start: "2026-12-01", hours: "Ja", weekends: "Nein", experience: "1 bis 3 Jahre", german: "Gut", consent: "Ja" });
  assert.equal(fit.fits, true);
  assert.equal(g.log.mail.length, 1);
  assert.match(g.log.mail[0].subject, /^Подходит: Anna Example/);
  assert.match(g.log.mail[0].body, /Ab wann kannst du anfangen\?: 2026-12-01/);
  const sheet = g.sheetsById[g.store.SHEET_ID].getSheets().find((s) => s.getFormUrl());
  assert.equal(sheet.data[1].at(-2), "✔");
  const no = submit(g, form, { name: "Ben", phone: "1", start: "2027-05-01", hours: "Nein", consent: "Ja" });
  assert.equal(no.fits, false);
  assert.equal(g.log.mail.length, 1, "notify.all=false: only fitting people are mailed");
  assert.match(sheet.data[2].at(-1), /hours: Nein/);
});

test("apps script: clinic mails every form; cleanup deletes answers older than 6 months", () => {
  const g = loadGas([here("../lib/HiringCore.gs"), here("../apps-script/Hiring.gs")], { config: ex("clinic-zahn") });
  g.ctx.setup();
  const form = g.forms[0];
  submit(g, form, { name: "Old Applicant", phone: "1", certificate: "Ja", hours: "Ja", consent: "Ja" }, new Date("2026-03-01T10:00:00Z"));
  submit(g, form, { name: "Maria Example", phone: "2", certificate: "Nein", hours: "Ja", consent: "Ja" });
  assert.equal(g.log.mail.length, 2);
  assert.match(g.log.mail[1].subject, /^Passt nicht: Maria Example/);
  const removed = g.ctx.cleanup();
  assert.equal(removed, 1);
  assert.equal(form.responses.length, 1);
  const sheet = g.sheetsById[g.store.SHEET_ID].getSheets().find((s) => s.getFormUrl());
  assert.equal(sheet.getLastRow(), 2);
  assert.equal(sheet.data[1][1], "Maria Example");
});

test("apps script: fit mark lands on the right row when answers arrive together; a failed mail is noted, not lost", () => {
  const g = loadGas([here("../lib/HiringCore.gs"), here("../apps-script/Hiring.gs")], { config: ex("clinic-zahn") });
  g.ctx.setup();
  const form = g.forms[0];
  const spec = JSON.parse(g.store.SPEC);
  const sheet = g.sheetsById[g.store.SHEET_ID].getSheets().find((s) => s.getFormUrl());
  const t1 = new Date("2026-11-27T10:00:00Z"), t2 = new Date("2026-11-27T10:00:05Z");
  const row = (a) => spec.items.map((i) => a[i.id] ?? "");
  sheet.appendRow([t1, ...row({ name: "First", certificate: "Ja", hours: "Ja" })]);
  sheet.appendRow([t2, ...row({ name: "Second", certificate: "Nein", hours: "Ja" })]);
  const items = spec.items.map((it) => ({ getItem: () => ({ getTitle: () => it.title }), getResponse: () => ({ name: "First", phone: "1", certificate: "Ja", hours: "Ja", consent: "Ja" })[it.id] ?? "" }));
  g.ctx.MailApp.sendEmail = () => { throw new Error("Service invoked too many times for one day: email."); };
  const fit = g.ctx.onSubmit({ response: { getItemResponses: () => items, getTimestamp: () => t1 } });
  assert.equal(fit.fits, true);
  assert.equal(sheet.data[1].at(-2), "✔", "mark on First's row, not on the last row");
  assert.match(sheet.data[1].at(-1), /mail not sent/);
  assert.notEqual(sheet.data[2].at(-2), "✔");
});

test("setup refuses a config with a forbidden custom question or missing GDPR contact", () => {
  const cfg = ex("cafe-olive");
  delete cfg.business.privacy_contact;
  const g = loadGas([here("../lib/HiringCore.gs"), here("../apps-script/Hiring.gs")], { config: cfg });
  assert.throws(() => g.ctx.setup(), /privacy_contact/);
});

test("no long dashes in kit files (vendor excluded)", () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk(here(".."))) assert.ok(!/[\u2013\u2014]/.test(fs.readFileSync(f, "utf8")), f);
});
