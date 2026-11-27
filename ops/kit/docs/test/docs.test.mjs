import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadGas } from "./gas-shim.mjs";
import { makeDocsWorld, evalFormula } from "./fake-docs.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const CORE = here("../lib/DocsCore.gs");
const GLUE = here("../apps-script/Docs.gs");
const core = vm.createContext({});
vm.runInContext(fs.readFileSync(CORE, "utf8"), core);
const ex = (n) => JSON.parse(fs.readFileSync(here(`../examples/${n}.json`), "utf8"));
const J = (x) => JSON.parse(JSON.stringify(x));

function boot(cfgName, today = "2026-11-27", extraCfg = {}) {
  const w = makeDocsWorld();
  const g = loadGas([CORE, GLUE], { config: { ...ex(cfgName), ...extraCfg }, extra: { DocumentApp: w.DocumentApp, DriveApp: w.DriveApp } });
  g.ctx.today_ = () => today;
  return { g, w, made: g.ctx.setup() };
}

test("trades: tick jobs, total adds up (site story: tiles 12 m², tap, 2 days)", () => {
  const c = core.calcDoc(ex("trades-kaya"), { lines: [{ id: "tiles", qty: 12 }, { id: "tap" }, { id: "day", qty: 2 }, { id: "removal", qty: 0 }] });
  assert.equal(c.net, 12 * 55 + 95 + 720);
  assert.equal(c.vat, 280.25);
  assert.equal(c.total, 1755.25);
  assert.equal(c.lines.length, 3);
  assert.throws(() => core.calcDoc(ex("trades-kaya"), { lines: [{ id: "nope" }] }), /unknown price id/);
});

test("cleaning: 120 m², twice a week (site story) gives a monthly price with discount, small business without VAT", () => {
  const cfg = ex("cleaning-blitz");
  const c = core.calcDoc(cfg, { area_m2: 120, visits_week: 2, extras: ["windows"] });
  const visit = Math.round(120 * 0.45 * 0.95 * 100) / 100; // 51.30
  assert.equal(c.lines[0].price, visit);
  assert.equal(c.lines[0].qty, 8.66);
  assert.equal(c.lines[0].sum, Math.round(visit * 8.66 * 100) / 100);
  assert.equal(c.total, c.lines[0].sum + 60);
  assert.equal(c.vat, 0);
  assert.equal(c.monthly, true);
  const small = core.calcDoc(cfg, { area_m2: 40, visits_week: 0 });
  assert.equal(small.total, 45, "minimum per visit");
  assert.match(small.lines[0].text, /Einmalige Reinigung 40 m²/);
});

test("numbers run without gaps and restart each year", () => {
  assert.equal(core.nextNumber("RE", 2026, null), "RE-2026-0001");
  assert.equal(core.nextNumber("RE", 2026, "RE-2026-0041"), "RE-2026-0042");
  assert.equal(core.nextNumber("RE", 2027, "RE-2026-0041"), "RE-2027-0001");
});

test("invoice checklist (§14 UStG) and small-amount invoice", () => {
  const cfg = ex("office-lang");
  const calc = core.calcDoc(cfg, { lines: [{ text: "Buchhaltung November", price: 380 }] });
  const doc = { type: "invoice", no: "RE-2026-0001", date: "2026-11-27", client: "Andrea Lang", calc };
  assert.deepEqual(J(core.invoiceProblems(cfg, doc)), ["buyer address", "service date (Leistungsdatum), can be the invoice date if same"]);
  const tiny = core.calcDoc(cfg, { lines: [{ text: "Kopie", price: 10 }] });
  assert.deepEqual(J(core.invoiceProblems(cfg, { ...doc, calc: tiny })), []);
  const noTax = { ...cfg, business: { ...cfg.business, vat_id: "" } };
  assert.ok(core.invoiceProblems(noTax, { ...doc, client_address: "x", service_date: "2026-11-27" }).includes("seller Steuernummer or USt-IdNr"));
});

test("placeholders: small business note, VAT lines, dates per language", () => {
  const cfg = ex("cleaning-blitz");
  const calc = core.calcDoc(cfg, { area_m2: 120, visits_week: 2 });
  const ph = core.docPlaceholders(cfg, { type: "quote", no: "AN-2026-0003", date: "2026-11-27", client: "Office A", calc, lang: "de" });
  assert.equal(ph["{{title}}"], "Angebot AN-2026-0003");
  assert.match(ph["{{notes}}"], /§ 19 UStG/);
  assert.match(ph["{{notes}}"], /bis 27\.12\.2026 gültig/);
  assert.doesNotMatch(ph["{{totals}}"], /USt/);
  assert.match(ph["{{totals}}"], /pro Monat/);
  const t = core.docPlaceholders(ex("trades-kaya"), { type: "invoice", no: "RE-2026-0001", date: "2026-11-27", client: "Anna", calc: core.calcDoc(ex("trades-kaya"), { lines: [{ id: "tap" }] }), lang: "en" });
  assert.match(t["{{totals}}"], /VAT 19 %: 18\.05 €/);
  assert.match(t["{{notes}}"], /by 11\/12\/2026/);
});

test("reminders: stages for invoices, one follow-up for quotes, 4 languages, wa.me link", () => {
  const cfg = ex("trades-kaya");
  const inv = { type: "invoice", no: "RE-2026-0007", date: "2026-11-01", client: "Anna", total: 1480, due: "2026-11-15", paid: false };
  assert.equal(core.reminderStage(inv, "2026-11-15", cfg), null);
  assert.equal(core.reminderStage(inv, "2026-11-16", cfg), "rem1");
  assert.equal(core.reminderStage(inv, "2026-11-30", cfg), "rem2");
  assert.equal(core.reminderStage(inv, "2026-12-20", cfg), "rem3");
  assert.equal(core.reminderStage({ ...inv, paid: true }, "2026-12-20", cfg), null);
  assert.equal(core.reminderStage({ type: "quote", date: "2026-11-20" }, "2026-11-27", cfg), "follow_quote");
  for (const lang of ["de", "en", "ru", "uk"]) {
    const t = core.messageFor("rem1", cfg, { ...inv, lang }, "2026-11-16");
    assert.ok(t.includes("RE-2026-0007") && /1[.,  ]?480,00 €|1,480\.00 €/.test(t), `${lang}: ${t}`);
    assert.ok(!/[\u2013\u2014]/.test(t));
  }
  assert.equal(core.waLinkD("+49 151 000", "a b", "49"), "https://wa.me/49151000?text=a%20b");
  assert.equal(core.waLinkD("", "x"), "");
});

test("example configs are valid", () => {
  for (const f of fs.readdirSync(here("../examples")).filter((f) => f.endsWith(".json"))) {
    assert.deepEqual(J(core.validateDocsConfig(JSON.parse(fs.readFileSync(here(`../examples/${f}`), "utf8")))), [], f);
  }
  assert.ok(core.validateDocsConfig({ mode: "items", business: { name: "x" }, doc_lang: "de" }).length >= 2);
});

/* ---------- Apps Script through the shims ---------- */

test("apps script trades: phone total formula equals the PDF total; PDF, log row, WhatsApp text", () => {
  const { g, w } = boot("trades-kaya");
  const f = g.ss.getSheetByName("Бланк");
  assert.ok(f, "form tab");
  assert.equal(g.log.triggers.length, 2);
  // tick tiles 12 m², tap, 2 days; fill client
  const row = (name) => f.data.findIndex((r) => r[1] === name) + 1;
  f.getRange(row("Fliesen verlegen inkl. Kleber"), 1, 1, 1).setValues([[true]]);
  f.getRange(row("Fliesen verlegen inkl. Kleber"), 5, 1, 1).setValues([[12]]);
  f.getRange(row("Waschtischarmatur montieren"), 1, 1, 1).setValues([[true]]);
  f.getRange(row("Arbeitstag (8 Std.)"), 1, 1, 1).setValues([[true]]);
  f.getRange(row("Arbeitstag (8 Std.)"), 5, 1, 1).setValues([[2]]);
  f.getRange("B3:B5").setValues([["Anna Beispiel"], ["Weg 1, 12345 Stadt"], ["0151 0000000"]]);
  const shown = evalFormula(f, f.data[8][1].slice(1));
  assert.equal(shown, 1755.25);
  // owner ticks "Make PDF" on the phone -> installable onEdit
  f.getRange("B10").setValues([[true]]);
  g.ctx.onEditInstalled({ range: f.getRange("B10"), value: "TRUE" });
  const log = g.ss.getSheetByName("Документы");
  const r = log.data[1];
  assert.equal(r[0], "AN-2026-0001");
  assert.equal(r[7], shown, "PDF total == phone total");
  assert.match(r[10], /drive\.google\.com/);
  assert.match(r[11], /Angebot AN-2026-0001 über 1\.755,25 €/);
  assert.match(r[12], /^https:\/\/wa\.me\/491510000000\?text=/);
  assert.equal(f.data[9][1], false, "checkbox reset");
  const pdf = Object.values(w.files).find((x) => x.id.startsWith("PDF_"));
  assert.match(pdf.blob.data, /Angebot AN-2026-0001/);
  assert.match(pdf.blob.data, /Fliesen verlegen inkl\. Kleber \| 12 m² \| 55,00 € \| 660,00 €/);
  assert.match(pdf.blob.data, /USt\. 19 %: 280,25 €/);
  assert.doesNotMatch(pdf.blob.data, /\{\{/);
  const copies = Object.values(w.files).filter((x) => x.id.startsWith("DOC_") && x.name.startsWith("AN-"));
  assert.ok(copies.every((x) => x.trashed), "working copy of the Doc is trashed");
  // second document gets the next number
  g.ctx.makeDocument();
  assert.equal(log.data[2][0], "AN-2026-0002");
});

test("apps script cleaning: area formula equals calcDoc for many inputs; invoice blocked until fields are there; email send", () => {
  const { g } = boot("cleaning-blitz");
  const f = g.ss.getSheetByName("Бланк");
  for (const [m2, n, win] of [[120, 2, true], [40, 0, false], [300, 3, false], [80, 1, true], [99.5, 5, false]]) {
    f.getRange("B14:B15").setValues([[m2], [n]]);
    f.getRange("A17").setValues([[win]]);
    const want = core.calcDoc(ex("cleaning-blitz"), { area_m2: m2, visits_week: n, extras: win ? ["windows"] : [] }).total;
    assert.equal(evalFormula(f, f.data[8][1].slice(1)), want, `${m2} m², ${n}/week`);
  }
  f.getRange("B2:B3").setValues([["Счёт"], ["Office A"]]);
  f.getRange("B14:B15").setValues([[120], [2]]);
  assert.equal(g.ctx.makeDocument(), null);
  assert.match(f.data[11][0], /^Не хватает: buyer address/);
  f.getRange("B4").setValues([["Str. 1, 12345 Stadt"]]);
  f.getRange("B6").setValues([["office@example.com"]]);
  f.getRange("B8").setValues([["2026-11-26"]]);
  f.getRange("B11").setValues([[true]]);
  const res = g.ctx.makeDocument();
  assert.equal(res.no, "RE-2026-0001");
  assert.equal(g.log.mail.length, 1);
  assert.equal(g.log.mail[0].to, "office@example.com");
  assert.equal(g.log.mail[0].attachments.length, 1);
  assert.match(g.log.mail[0].body, /Rechnung RE-2026-0001/);
  /* mail quota used up: the PDF and number still exist, the sheet says the mail was not sent */
  g.ctx.MailApp.sendEmail = () => { throw new Error("Service invoked too many times for one day: email."); };
  f.getRange("B11").setValues([[true]]);
  const res2 = g.ctx.makeDocument();
  assert.equal(res2.no, "RE-2026-0002");
  assert.match(res2.mail_error, /mail NOT sent/);
  assert.match(f.data[11][0], /RE-2026-0002.*mail NOT sent/);
});

test("apps script office: free lines, daily reminders fill text and link only for open invoices", () => {
  const { g } = boot("office-lang", "2026-11-01");
  const f = g.ss.getSheetByName("Бланк");
  f.getRange("B2:B8").setValues([["Счёт"], ["Andrea Lang"], ["Weg 2, 12345 Stadt"], ["0170 1111111"], [""], ["de"], ["2026-10-31"]]);
  f.getRange("A14:C14").setValues([["Buchhaltung Oktober", "", 380]]);
  assert.equal(evalFormula(f, f.data[8][1].slice(1)), 452.2);
  g.ctx.makeDocument();
  f.getRange("B3").setValues([["Bauer GmbH"]]);
  g.ctx.makeDocument();
  const log = g.ss.getSheetByName("Документы");
  log.getRange("J3").setValues([[true]]); // Bauer paid
  g.ctx.today_ = () => "2026-11-27";
  assert.equal(g.ctx.refreshReminders(), 1);
  assert.match(log.data[1][13], /war am 15\.11\.2026 fällig/);
  assert.match(log.data[1][14], /^https:\/\/wa\.me\/491701111111/);
  assert.equal(log.data[2][13], "");
});

test("apps script other: manual mode makes two ready Google Docs with sample values, no sheet logic", () => {
  const { g, w, made } = boot("other-kiosk");
  assert.equal(made.manual, true);
  assert.equal(g.log.triggers.length, 0);
  const tpl = w.docs[g.store.TEMPLATE_quote];
  const text = tpl.body.text();
  assert.match(text, /Angebot AN-2026-0001/);
  assert.match(text, /Anna Beispiel/);
  assert.match(text, /Gesamt: 240,00 €/);
  assert.match(text, /§ 19 UStG/);
  assert.doesNotMatch(text, /\{\{/);
});

test("no long dashes in kit files", () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk(here(".."))) assert.ok(!/[\u2013\u2014]/.test(fs.readFileSync(f, "utf8")), f);
});
