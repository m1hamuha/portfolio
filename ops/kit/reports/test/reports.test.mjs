import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadGas, fakeFile } from "./gas-shim.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const CORE = here("../lib/ReportsCore.gs");
const GLUE = here("../apps-script/Reports.gs");
const core = vm.createContext({});
vm.runInContext(fs.readFileSync(CORE, "utf8"), core);
const ex = (n) => JSON.parse(fs.readFileSync(here(`../examples/${n}.json`), "utf8"));

test("helpers: numbers, dates, weeks", () => {
  assert.equal(core.num("1.234,50"), 1234.5);
  assert.equal(core.num("1,5"), 1.5);
  assert.equal(core.num("1,234.5"), 1234.5);
  assert.equal(core.num(""), 0);
  assert.equal(core.isoDate("27.11.2026"), "2026-11-27");
  assert.deepEqual({ ...core.lastWeek("2026-11-27") }, { from: "2026-11-16", to: "2026-11-22" });
  assert.equal(core.fmtMoney(2140, "ru"), "2 140 €");
  assert.equal(core.fmtMoney(1480.5, "de"), "1.480,50 €");
});

test("cafe: closing counts give weekly usage, over plan is flagged (site story: milk 41 L vs 30)", () => {
  const items = ex("cafe-olive").items;
  const counts = [
    { date: "2026-11-15", item: "milk", left: 12 }, { date: "2026-11-22", item: "milk", left: 6 },
    { date: "2026-11-15", item: "beans", left: 4 }, { date: "2026-11-22", item: "beans", left: 3 },
    { date: "2026-11-15", item: "Стаканы 0,3", left: 500 }, { date: "2026-11-22", item: "cups", left: 150 },
  ];
  const deliveries = [{ date: "2026-11-18", item: "milk", qty: 35 }, { date: "2026-11-18", item: "beans", qty: 5 }];
  const rep = core.stockUsage(items, counts, deliveries, "2026-11-16", "2026-11-22");
  const milk = rep.lines.find((l) => l.id === "milk");
  assert.equal(milk.used, 41);
  assert.equal(milk.over, true);
  assert.equal(rep.lines.find((l) => l.id === "beans").used, 6);
  assert.equal(rep.lines.find((l) => l.id === "cups").used, 350);
  const text = core.stockReportText(rep, "ru");
  assert.match(text, /Молоко: 41 л, план 30 л/);
  assert.match(text, /больше плана на 37%/);
});

test("trades: hours per job, night shift, breaks, late entries", () => {
  const rows = [
    { ts: "2026-11-17", worker: "A", job: "Miller", date: "2026-11-17", start: "07:00", end: "16:00", pause_min: 30 },
    { ts: "2026-11-17", worker: "B", job: "Miller", date: "2026-11-17", start: "7.00", end: "15.30", pause_min: "30" },
    { ts: "2026-11-30", worker: "C", job: "Miller", date: "2026-11-18", start: "22:00", end: "06:00", pause_min: 0 },
    { ts: "2026-11-18", worker: "A", job: "Schulz", date: "2026-11-18", start: "08:00", end: "08:00" },
    { ts: "2026-11-25", worker: "A", job: "Miller", date: "2026-11-25", start: "08:00", end: "12:00" },
  ];
  const r = core.hoursSummary(rows, "2026-11-16", "2026-11-22");
  const miller = r.jobs.find((j) => j.job === "Miller");
  assert.equal(miller.hours, 8.5 + 8 + 8);
  assert.equal(miller.workers, 3);
  assert.equal(r.late, 1);
  assert.equal(r.problems.length, 1); // 08:00 to 08:00 is treated as 24 h and rejected
  assert.match(core.hoursReportText(r, "de"), /Miller: 3 Pers\., 24\.5 Std\./);
});

test("cleaning: who owes cash and what is left (site story: Olga owes 412)", () => {
  const cfg = ex("cleaning-blitz");
  const entries = [
    { date: "2026-11-03", cleaner: "Olga", cash: 250, spent: 38 },
    { date: "2026-11-10", cleaner: "Olga", cash: "200" },
    { date: "2026-11-11", cleaner: "Irina", cash: 300, spent: 0, handed: 300 },
    { date: "2026-10-30", cleaner: "Maria", cash: 100, handed: 50 },
  ];
  const other = { income: [{ date: "2026-11-15", amount: 6000 }], costs: [{ date: "2026-11-02", amount: 90, what: "insurance" }] };
  const led = core.cashLedger(entries, "2026-11", { wages: cfg.wages, fixed: cfg.fixed }, other);
  const olga = led.people.find((p) => p.cleaner === "Olga");
  assert.equal(olga.owes, 412);
  assert.equal(led.people.find((p) => p.cleaner === "Maria").owes, 50); // older months still count for debt
  assert.equal(led.income, 750 + 6000);
  assert.equal(led.left, 6750 - 38 - 90 - 3200 - 670);
  assert.match(core.ledgerText(led, "ru"), /Olga: взяла наличными 450 €, расходы 38 €, отдала 0 €, должна тебе 412 €/);
});

test("office: overdue invoices, reminder stages in 4 languages, WhatsApp link", () => {
  const rec = core.receivables([
    { no: "2026-041", client: "Bauer GmbH", amount: 1400, issued: "2026-10-30", due: "2026-11-15", paid: false, phone: "0151 2345678" },
    { no: "2026-042", client: "Lang", amount: 380, due: "2026-11-30", paid: false },
    { no: "2026-043", client: "Old", amount: 99, due: "2026-09-01", paid: true },
    { no: "2026-044", client: "Late", amount: 50, due: "2026-10-20", paid: "FALSE" },
  ], "2026-11-27");
  const bauer = rec.rows[0];
  assert.equal(bauer.late, 12);
  assert.equal(bauer.stage, 1);
  assert.equal(rec.rows[3].stage, 3);
  assert.equal(rec.open_total, 1830);
  assert.equal(rec.overdue_total, 1450);
  assert.equal(rec.due_this_month, 380);
  for (const l of ["ru", "uk", "de", "en"]) {
    const t = core.reminderText(bauer, "Example", "2026-11-27", l);
    assert.ok(t.includes("2026-041") && /1[ .,]?400/.test(t), l);
    assert.ok(!/[\u2013\u2014]/.test(t));
  }
  assert.match(core.reminderText(rec.rows[3], "X", "2026-11-27", "de"), /bis zum 2026-12-04/);
  const link = core.waLink("0151 2345678", "Hallo & Gruß", "49");
  assert.equal(link, "https://wa.me/491512345678?text=Hallo%20%26%20Gru%C3%9F");
});

test("shop: reorder list and slow movers (site story: 3 left, 18 sold, order 20)", () => {
  const items = [
    { sku: "CAT-CH", name: "Cat food, chicken", stock: 3, supplier: "Zoo GmbH", pack: 10, cover_days: 7 },
    { sku: "OLD", name: "Old brand", stock: 12, supplier: "Zoo GmbH" },
    { sku: "DOG", name: "Dog snack", stock: 40, supplier: "Snack AG" },
  ];
  const sales = [];
  for (let d = 20; d <= 26; d++) sales.push({ date: `2026-11-${d}`, sku: "CAT-CH", qty: d < 24 ? 3 : 2 });
  sales.push({ date: "2026-08-01", sku: "OLD", qty: 1 });
  sales.push({ date: "2026-11-25", sku: "DOG", qty: 2 });
  const r = core.reorderList(items, sales, "2026-11-27", {});
  assert.equal(r.reorder.length, 1);
  assert.equal(r.reorder[0].sold7, 18);
  assert.equal(r.reorder[0].order, 20);
  assert.equal(r.slow[0].sku, "OLD");
  assert.ok(r.slow[0].days >= 90);
  const t = core.reorderText(r, "ru");
  assert.match(t, /осталось 3, за неделю ушло 18, закажи 20/);
  const counted = core.stockFromCount([{ sku: "DOG", counted: 50, counted_at: "2026-11-20" }], sales, [{ date: "2026-11-22", sku: "DOG", qty: 6 }]);
  assert.equal(counted[0].stock, 54);
});

test("other: bank CSV to one page (site story: 6,200 in, 4,900 out, 1,300 left)", () => {
  const cfg = ex("other-kiosk");
  const rows = core.csvToObjects(fs.readFileSync(here("../examples/bank.sample.csv"), "utf8"), cfg.bank_csv.map, ";");
  const txc = core.categorize(rows, cfg.rules);
  const sm = core.monthSummary(txc, "2026-11");
  assert.equal(sm.in, 6200);
  assert.equal(sm.out, 4900); // own transfer of 500 is not a cost
  assert.equal(sm.left, 1300);
  assert.equal(sm.cats.find((c) => c.cat === "bank").delta, 60);
  const text = core.onePageText(sm, "en", {}, "Kiosk");
  assert.match(text, /Came in: 6,200 €/);
  assert.match(text, /bank: 120 € \(60 € more than last month\)/);
  assert.equal(sm.unsorted, 0);
});

test("csv parser: quotes, BOM, semicolons, missing column error", () => {
  const rows = core.parseCsv('﻿a;b\n"x;1";"say ""hi"""\r\n2;3\n');
  assert.equal(JSON.stringify(rows), JSON.stringify([["a", "b"], ["x;1", 'say "hi"'], ["2", "3"]]));
  assert.throws(() => core.csvToObjects("a;b\n1;2", { date: "Datum" }), /column not found/);
});

test("all example configs are valid", () => {
  for (const f of fs.readdirSync(here("../examples")).filter((f) => f.endsWith(".json"))) {
    const cfg = JSON.parse(fs.readFileSync(here(`../examples/${f}`), "utf8"));
    assert.deepEqual([...core.validateReportConfig(cfg)], [], f);
  }
  assert.ok(core.validateReportConfig({ kind: "x", lang: "fr", business: {} }).length >= 3);
});

/* ---------- Apps Script glue through the shim ---------- */

const ts = (d) => new Date(`${d}T21:30:00Z`);

test("apps script: cafe setup builds the closing form and the totals tab fills after answers", () => {
  const g = loadGas([CORE, GLUE], { config: ex("cafe-olive") });
  const made = g.ctx.setup();
  assert.match(made.form_url, /viewform/);
  const form = g.forms[0];
  assert.ok(form.items.some((i) => i.title === "Осталось: Молоко (л)"));
  assert.equal(form.published, true, "form is published so staff / applicants can answer");
  assert.equal(form.requireLogin, false, "no login required, also in a Workspace domain");
  assert.ok(form.items.some((i) => i.type === "PageBreak"));
  assert.deepEqual(g.log.triggers.map((t) => t.fn).sort(), ["refresh", "weekly"]);
  const ans = g.ss.getSheetByName("Ответы");
  assert.ok(ans, "responses tab renamed");
  const head = ans.data[0];
  const row = (date, milk, beans, cups, got) => {
    const r = head.map(() => "");
    r[0] = ts(date); r[head.indexOf("Твоё имя")] = "Barista 1";
    r[head.indexOf("Осталось: Молоко (л)")] = milk; r[head.indexOf("Осталось: Кофе в зёрнах (кг)")] = beans; r[head.indexOf("Осталось: Стаканы 0,3 (шт)")] = cups;
    if (got) r[head.indexOf("Привезли: Молоко (л)")] = got;
    return r;
  };
  ans.appendRow(row("2026-11-15", 12, 4, 500));
  ans.appendRow(row("2026-11-18", 30, 3, 300, 35));
  ans.appendRow(row("2026-11-22", 6, 3, 150));
  const realDate = g.ctx.todayIso_;
  g.ctx.todayIso_ = () => "2026-11-24";
  const res = g.ctx.weekly();
  g.ctx.todayIso_ = realDate;
  assert.equal(res.last.lines.find((l) => l.id === "milk").used, 41);
  assert.match(g.ss.getSheetByName("Итоги").data.flat().join("\n"), /Молоко: 41 л/);
  assert.equal(g.log.mail.length, 1);
  assert.match(g.log.mail[0].subject, /Cafe Olive/);
});

test("apps script: trades hours form and weekly totals", () => {
  const g = loadGas([CORE, GLUE], { config: ex("trades-bau") });
  g.ctx.setup();
  const ans = g.ss.getSheetByName("Antworten");
  const head = ans.data[0];
  assert.deepEqual(head.slice(1), ["Dein Name", "Baustelle / Objekt", "Datum", "Beginn", "Ende", "Pause, Minuten"]);
  ans.appendRow([ts("2026-11-17"), "Worker A", "Miller, Bad", "2026-11-17", "07:00", "16:30", 30]);
  ans.appendRow([ts("2026-11-18"), "Worker B", "Miller, Bad", "2026-11-18", "07:00", "15:00", ""]);
  g.ctx.todayIso_ = () => "2026-11-24";
  const r = g.ctx.refresh();
  assert.equal(r.previous.total, 17);
  assert.match(g.ss.getSheetByName("Übersicht").data.flat().join("\n"), /Miller, Bad: 2 Pers\., 17 Std\./);
});

test("apps script: cleaning cash form and owner tab", () => {
  const g = loadGas([CORE, GLUE], { config: ex("cleaning-blitz") });
  g.ctx.setup();
  const ans = g.ss.getSheetByName("Ответы");
  ans.appendRow([ts("2026-11-03"), "Olga", "2026-11-03", "Office A", 450, 38, 0, ""]);
  g.ss.getSheetByName("Доходы и расходы").appendRow(["2026-11-10", "in", 5800, "bank transfers"]);
  g.ctx.todayIso_ = () => "2026-11-27";
  const led = g.ctx.refresh();
  assert.equal(led.people[0].owes, 412);
  assert.equal(led.left, 450 + 5800 - 38 - 3200 - 670);
});

test("apps script: office invoices tab gets late days, reminder and WhatsApp link", () => {
  const g = loadGas([CORE, GLUE], { config: ex("office-steuer") });
  g.ctx.setup();
  const sh = g.ss.getSheetByName("Счета");
  assert.equal(sh.rules.length, 1);
  sh.appendRow(["2026-041", "Bauer GmbH", "0151 2345678", "de", 1400, "2026-10-30", "2026-11-15", false]);
  sh.appendRow(["2026-042", "Lang", "", "", 380, "2026-11-01", "2026-11-30", false]);
  g.ctx.todayIso_ = () => "2026-11-27";
  g.ctx.refresh();
  assert.equal(sh.data[1][8], 12);
  assert.match(sh.data[1][9], /Rechnung 2026-041 über 1\.400 €/);
  assert.match(sh.data[1][10], /^https:\/\/wa\.me\/491512345678\?text=/);
  assert.equal(sh.data[2][9], "");
});

test("apps script: shop imports the till CSV from Drive and mails the Monday list", () => {
  const cfg = ex("shop-eck");
  const csv = "Datum;Artikelnummer;Menge\n" + Array.from({ length: 7 }, (_, i) => `2026-11-${20 + i};CAT-CH;${i < 4 ? 3 : 2}`).join("\n");
  const g = loadGas([CORE, GLUE], { config: cfg, drive: { PUT_DRIVE_FOLDER_ID_HERE: [fakeFile("export.csv", csv)] } });
  g.ctx.setup();
  g.ss.getSheetByName("Товары").appendRow(["CAT-CH", "Корм для кошек, курица", "Zoo GmbH", 10, "", 7, 3, "", ""]);
  assert.equal(g.ctx.importTill(), 7);
  assert.equal(g.ctx.importTill(), 0, "same file is not imported twice");
  g.ctx.todayIso_ = () => "2026-11-27";
  g.ctx.weekly();
  assert.match(g.log.mail[0].body, /осталось 3, за неделю ушло 18, закажи 20/);
});

test("apps script: zettle adapter with mocked HTTP", () => {
  const cfg = { ...ex("shop-eck"), till: { type: "zettle" } };
  const g = loadGas([CORE, GLUE], {
    config: cfg, props: { ZETTLE_API_KEY: "test-key", ZETTLE_CLIENT_ID: "test-client" },
    fetch: (url, o) => {
      if (url.startsWith("https://oauth.zettle.com/token")) {
        assert.equal(o.payload.assertion, "test-key");
        return { body: { access_token: "AT" } };
      }
      assert.equal(o.headers.Authorization, "Bearer AT");
      return { body: { purchases: [
        { purchaseUUID1: "P1", timestamp: "2026-11-26T10:00:00.000+0000", products: [{ sku: "CAT-CH", name: "Cat", quantity: "2" }] },
        { timestamp: "2026-11-26T11:00:00.000+0000", refund: true, products: [{ sku: "CAT-CH", quantity: "-1" }] },
      ] } };
    },
  });
  g.ctx.setup();
  assert.equal(g.ctx.importTill(), 1);
  assert.deepEqual(g.ss.getSheetByName("Продажи").data[1], ["2026-11-26", "CAT-CH", 2, "P1#0"]);
  assert.equal(g.log.fetch.length, 2);
  /* next night the window overlaps by one day: the same receipt is not counted twice */
  assert.equal(g.ctx.importTill(), 0);
  assert.equal(g.ss.getSheetByName("Продажи").getLastRow(), 2);
});

test("apps script: monthly one page from bank file in Drive", () => {
  const cfg = { ...ex("other-kiosk"), bank_folder_id: "BANK" };
  const g = loadGas([CORE, GLUE], { config: cfg, drive: { BANK: [fakeFile("umsatz.csv", fs.readFileSync(here("../examples/bank.sample.csv"), "utf8"))] } });
  g.ctx.setup();
  g.ctx.todayIso_ = () => "2026-12-03";
  const sm = g.ctx.monthly();
  assert.equal(sm.left, 1300);
  /* the next export overlaps the first one: same payments must not be counted twice */
  g.ctx.DriveApp.getFolderById("BANK").createFile({ name: "umsatz2.csv", data: fs.readFileSync(here("../examples/bank.sample.csv"), "utf8") });
  assert.equal(g.ctx.importBankCsv(), 0);
  assert.equal(g.ctx.monthly(true).left, 1300);
  assert.match(g.log.mail.at(-1).body, /Пришло: 6 200 €/);
  assert.match(g.ss.getSheetByName("Месяц").data.flat().join("\n"), /Осталось: 1 300 €/);
});

test("no long dashes in kit files", () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === "node_modules" ? [] : e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk(here(".."))) assert.ok(!/[\u2013\u2014]/.test(fs.readFileSync(f, "utf8")), f);
});
