import test from "node:test";
import assert from "node:assert/strict";
import { route, approve, approvalLink, pickCategory } from "../lib/repair-route.mjs";
import { drafts, missing, markSent } from "../lib/missing-docs.mjs";
import { extract, toRows } from "../lib/order-extract.mjs";
import { makeLLM } from "../lib/llm.mjs";

const cfg = {
  lang: "de", manager: { email: "verwaltung@firm.example" },
  categories: [
    { id: "water", words: ["wasser", "rohr"], tradesman: { name: "S", email: "sanitaer@trade.example" } },
    { id: "power", words: ["steckdose"], tradesman: { name: "E", email: "elektro@trade.example" } },
  ],
};

test("repair: picks tradesman, hides tenant contact without consent, nothing approved without a valid token", () => {
  const now = Date.UTC(2026, 10, 3);
  const r = route(cfg, { id: "R1", text: "Das Rohr im Bad tropft", address: "Hauptstr. 1", unit: "2. OG links", name: "Frau Beispiel", phone: "0170 0000000", contactOk: false, photos: ["https://drive.example/f1"] }, { secret: "s3", now });
  assert.equal(r.category, "water");
  assert.equal(r.draft.to, "sanitaer@trade.example");
  assert.ok(!r.draft.body.includes("Beispiel") && !r.draft.body.includes("0170"));
  assert.match(r.draft.body, /Termin bitte über die Verwaltung/);
  assert.match(approvalLink("https://script.example/exec", r.token), /\?approve=/);
  assert.deepEqual(approve(r.token, { secret: "s3", now }), { ok: true, id: "R1", to: "sanitaer@trade.example" });
  assert.equal(approve(r.token, { secret: "other", now }).ok, false);
  assert.equal(approve(r.token, { secret: "s3", now: now + 73 * 3600e3 }).reason, "expired");
  const [p, s] = r.token.split(".");
  const forged = Buffer.from(JSON.stringify({ id: "R1", to: "evil@x.example", exp: now + 1e9 })).toString("base64url");
  assert.equal(approve(`${forged}.${s}`, { secret: "s3", now }).ok, false);
  assert.ok(p);
});

test("repair: consent shows contact, unknown goes to the manager", () => {
  const r = route(cfg, { id: "R2", category: "power", text: "x", address: "A", contactOk: true, name: "Herr B", phone: "0170 1" }, { secret: "s" });
  assert.match(r.draft.body, /Kontakt Mieter: Herr B, 0170 1/);
  const u = route(cfg, { id: "R3", text: "Tür klemmt", address: "A" }, { secret: "s" });
  assert.equal(u.needsManager, true);
  assert.equal(u.draft.to, "verwaltung@firm.example");
  assert.equal(pickCategory(cfg, { text: "WASSER im Keller" }).id, "water");
  assert.throws(() => route(cfg, {}, { secret: "" }), /ROUTE_SECRET/);
});

test("missing docs: drafts only for what is missing, respects interval and limit", () => {
  const rows = [
    { case: "2026-014", name: "Frau Beispiel", email: "a@example.de", lang: "de", needed: ["Lohnsteuerbescheinigung", "Spendenquittung"], received: ["lohnsteuerbescheinigung"], lastReminder: "2026-10-20" },
    { case: "2026-015", email: "b@example.de", needed: ["Mietvertrag"], received: [], lastReminder: "2026-11-01" },
    { case: "2026-016", email: "c@example.de", needed: ["X"], received: ["X"] },
    { case: "2026-017", email: "d@example.de", lang: "ru", needed: ["Паспорт"], reminders: 3 },
    { case: "2026-018", email: "e@example.de", lang: "uk", needed: ["Довідка"] },
  ];
  assert.deepEqual(missing(rows[0]), ["Spendenquittung"]);
  const d = drafts(rows, { today: new Date("2026-11-03"), firm: "Kanzlei Beispiel" });
  assert.deepEqual(d.map((x) => x.case), ["2026-014", "2026-017", "2026-018"]);
  assert.equal(d[0].subject, "Unterlagen für Vorgang 2026-014");
  assert.match(d[0].body, /Guten Tag Frau Beispiel,[\s\S]*- Spendenquittung[\s\S]*Kanzlei Beispiel$/);
  assert.ok(!d[0].body.includes("Lohnsteuer"));
  assert.match(d[1].skip, /max reminders/);
  assert.match(d[2].body, /^Добрий день!/);
});

const catalog = [{ sku: "FL-10", name: "Fliesenkleber 25 kg", unit: "Sack", price: 18.9 }, { sku: "SI-3", name: "Silikon weiß", unit: "Kartusche", price: 6.5 }];

test("orders: model output checked against the article list", async () => {
  const llm = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: (req) => {
    assert.ok(!req.user.includes("kunde@example.de"));
    return 'Here: {"customer":"Bau Beispiel","orderRef":"B-77","delivery":"Fr","lines":[{"sku":"FL-10","name":"Kleber","qty":12},{"sku":"","name":"Fugenmasse grau","qty":3},{"sku":"SI-3","name":"Silikon","qty":"viele"}]}';
  } });
  const r = await extract(llm, "Bitte liefern: 12 Sack FL-10, 3 Fugenmasse grau, Silikon. Gruß, kunde@example.de", catalog);
  assert.equal(r.rows.length, 3);
  assert.deepEqual(r.rows[0], { customer: "Bau Beispiel", orderRef: "B-77", delivery: "Fr", sku: "FL-10", name: "Fliesenkleber 25 kg", qty: 12, unit: "Sack", price: 18.9, check: "" });
  assert.deepEqual(r.doubtful.map((x) => x.name), ["Fugenmasse grau", "Silikon weiß"]);
  const broken = await extract(makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: "sorry" }), "x", catalog);
  assert.equal(broken.rows.length, 0);
  assert.equal(toRows({ lines: [{ sku: "XX", qty: 1 }] }, catalog).doubtful.length, 1);
});

test("repair: a second tap on the same link does not send twice", () => {
  const now = Date.UTC(2026, 10, 3);
  const r = route(cfg, { id: "R9", text: "Rohr", address: "A" }, { secret: "s", now });
  const used = new Set();
  const first = approve(r.token, { secret: "s", now, used });
  assert.equal(first.ok, true);
  used.add(first.id);
  assert.equal(approve(r.token, { secret: "s", now, used }).reason, "already sent");
});

test("missing docs: markSent counts reminders, the 4th is never drafted", () => {
  let row = { case: "2026-020", email: "x@example.de", needed: ["A"] };
  let day = new Date("2026-11-01");
  for (let i = 0; i < 3; i++) {
    const d = drafts([row], { today: day });
    assert.ok(d[0].subject);
    row = markSent(row, day);
    day = new Date(day.getTime() + 8 * 864e5);
  }
  assert.equal(row.reminders, 3);
  assert.match(drafts([row], { today: day })[0].skip, /max reminders/);
  assert.equal(drafts([markSent({ ...row, reminders: 0 }, day)], { today: day }).length, 0);
});
