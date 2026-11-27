// Offline tests for the leads Apps Script. Run: node --test ops/kit/leads/test/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGas } from "./gas-shim.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const gs = ["LeadsCore.gs", "LeadsMain.gs"].map(f => path.join(dir, "../apps-script", f));
const cfgFile = n => fs.readFileSync(path.join(dir, "../config", n + ".example.json"), "utf8");
const J = x => JSON.parse(JSON.stringify(x));
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

function fakeGmail(threads) {
  const labels = {};
  return {
    threads,
    getUserLabelByName: n => labels[n] || null,
    createLabel: n => (labels[n] = { name: n }),
    search(q) {
      const m = q.match(/-label:"([^"]+)"/);
      return threads.filter(t => !(m && t.labels.includes(m[1])));
    }
  };
}
function thread(id, from, subject, body, date) {
  const t = { labels: [], getId: () => id, addLabel: l => t.labels.push(l.name),
    getMessages: () => [{ getId: () => "m" + id, getFrom: () => from, getSubject: () => subject, getPlainBody: () => body, getDate: () => new Date(date) }] };
  return t;
}
function setNow(ctx, iso) { ctx.Date = class extends Date { constructor(...a) { a.length ? super(...a) : super(iso); } static now() { return new Date(iso).getTime(); } }; }
const rows = c => c.__book.getSheetByName("Leads").data.slice(1);

test("parse site-form e-mails in two common layouts", () => {
  const c = loadGas(gs);
  assert.deepEqual(J(c.parseFormBody("Name: Mark Weber\nTelefon: 0171 2345678\nNachricht: Kessel tropft,\nbitte Rückruf\nWunschtermin: Donnerstag")),
    { name: "Mark Weber", phone: "0171 2345678", what: "Kessel tropft, bitte Rückruf", when: "Donnerstag" });
  assert.deepEqual(J(c.parseFormBody("Имя\nАнна\n\nТелефон\n+49 151 1112223\n\nСообщение\nтрёшка, пятница")),
    { name: "Анна", phone: "+49 151 1112223", what: "трёшка, пятница" });
  assert.equal(c.stripQuoted("Hallo,\nich brauche ein Angebot.\n\nAm 3. Nov schrieb Tom:\n> alt"), "Hallo,\nich brauche ein Angebot.\n");
});

test("checkMail: form and direct mail become rows, only a label is added, alert goes out once", () => {
  const ths = [
    thread("t1", "WordPress <wordpress@tom-sanitaer.example>", "Neue Anfrage", "Name: Mark\nTelefon: 0171 2345678\nNachricht: Kessel tropft\nWunschtermin: Do", "2026-11-26T08:00:00Z"),
    thread("t2", "Petra Lang <petra@example.com>", "Angebot Bad", "Guten Tag, ich brauche ein Angebot für ein Bad. Tel 0160 9998887\n\nAm 1. Nov schrieb X:\n> old", "2026-11-27T07:00:00Z")
  ];
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("trades"), TG_BOT_TOKEN: "bot", SHEET_ID: "x" } });
  c.GmailApp = fakeGmail(ths);
  const cfg = JSON.parse(cfgFile("trades")); cfg.notify.telegramChatIds = ["42"];
  c.__props.CONFIG_JSON = JSON.stringify(cfg);
  setNow(c, "2026-11-27T09:00:00Z");
  assert.equal(c.checkMail(), 2);
  const r = rows(c);
  assert.equal(r.length, 2);
  assert.deepEqual(ths.map(t => [...t.labels]), [["Leads"], ["Leads"]]);
  const mark = r.find(x => x[5] === "Mark");
  assert.equal(mark[4], "сайт"); assert.equal(mark[6], "+491712345678"); assert.equal(mark[9], "https://wa.me/491712345678");
  assert.match(mark[2], /без ответа с четверга/);
  const petra = r.find(x => x[5] === "Petra Lang");
  assert.equal(petra[6], "petra@example.com, +491609998887");
  assert.ok(!petra[7].includes("old"), "quoted text dropped");
  assert.equal(petra[9], "https://mail.google.com/mail/u/0/#all/t2");
  assert.equal(r[0][5], "Petra Lang", "newest unanswered on top");
  const tg = c.__sent.fetch.filter(f => f.url.includes("api.telegram.org/botbot/sendMessage"));
  assert.equal(tg.length, 2);
  assert.match(JSON.parse(tg[0].opts.payload).text, /Новая заявка \(сайт\): Mark, Kessel tropft, Do, \+491712345678/);
  assert.equal(c.checkMail(), 0, "labelled threads are not read again");
});

test("quote follow-up rises after followUpDays, done goes down, a new message reopens", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("trades"), SHEET_ID: "x", LEADS_SECRET: "sec" } });
  setNow(c, "2026-11-27T09:00:00Z");
  const post = lead => c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead }) } });
  post({ channel: "phone", name: "Mark", contact: "+491711", what: "boiler" });
  post({ channel: "site", name: "Old", contact: "+491722", what: "tap" });
  const sh = c.__book.getSheetByName("Leads");
  const oldRow = sh.data.findIndex(r => r[5] === "Old");
  sh.data[oldRow][10] = "смета отправлена"; sh.data[oldRow][11] = "2026-11-21";
  const markRow = sh.data.findIndex(r => r[5] === "Mark");
  sh.data[markRow][0] = true;
  c.onEdit({ range: { getSheet: () => sh, getRow: () => markRow + 1, getColumn: () => 1 } });
  let r = rows(c);
  assert.equal(r[0][5], "Old"); assert.equal(r[0][2], "смета отправлена 6 дн. назад, перезвонить");
  assert.equal(r[1][5], "Mark"); assert.equal(r[1][1], 9);
  post({ channel: "phone", name: "Mark", contact: "+491711", what: "still leaking" });
  r = rows(c);
  assert.equal(r.length, 2, "same person, same row");
  const m = r.find(x => x[5] === "Mark");
  assert.equal(m[0], false); assert.match(m[7], /^still leaking \| boiler/);
  // stage edit stamps the date
  const i = sh.data.findIndex(x => x[5] === "Mark");
  sh.data[i][10] = "ответил";
  c.onEdit({ range: { getSheet: () => sh, getRow: () => i + 1, getColumn: () => 11 } });
  assert.match(String(sh.data.find(x => x[5] === "Mark")[11]), /^2026-11-27$/);
});

test("doPost: a failing alert never loses the lead; a busy lock answers busy so the Worker retries", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("office"), SHEET_ID: "x", LEADS_SECRET: "sec", TG_BOT_TOKEN: "t" } });
  c.UrlFetchApp = { fetch: () => { throw new Error("DNS error"); } };
  const res = JSON.parse(c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "site", name: "Anna Klein", contact: "+49171234567", what: "Buchhaltung" } }) } }).text);
  assert.equal(res.ok, true);
  assert.equal(rows(c).length, 1);
  c.LockService = { getScriptLock: () => ({ tryLock: () => false, releaseLock() {} }) };
  const busy = JSON.parse(c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "site", name: "B", contact: "+49171000000" } }) } }).text);
  assert.deepEqual(busy, { ok: false, error: "busy" });
  assert.equal(rows(c).length, 1);
});

test("doPost refuses a wrong secret and drops unsafe links", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("office"), SHEET_ID: "x", LEADS_SECRET: "sec" } });
  assert.match(c.doPost({ postData: { contents: JSON.stringify({ secret: "nope", lead: { name: "x" } }) } }).text, /forbidden/);
  c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "evil", name: "Anna Klein", contact: "0171 234 567", what: "needs an accountant", open: "javascript:alert(1)" } }) } });
  const r = rows(c)[0];
  assert.equal(r[4], "Website"); assert.equal(r[9], "");
});

test("clinic: alert carries no name and no message text", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("clinic"), SHEET_ID: "x", LEADS_SECRET: "sec", TG_BOT_TOKEN: "b" } });
  c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "facebook", name: "Maria S.", what: "Check-up for my son after 15:00" } }) } });
  const text = JSON.parse(c.__sent.fetch[0].opts.payload).text;
  assert.equal(text, "Neue Anfrage (Facebook). Liste öffnen: https://docs.google.com/spreadsheets/d/sheet-test-id");
  const cfg = c.parseLeadsConfig(JSON.parse(cfgFile("clinic")));
  assert.equal(cfg.llm.enabled, false);
});

test("quick-add Google Form answer becomes a row without an alert", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("trades"), SHEET_ID: "x", TG_BOT_TOKEN: "b" } });
  c.onFormSubmitLead({ namedValues: { "Откуда": ["WhatsApp"], "Имя": ["Ирина"], "Телефон": ["0176 5554443"], "Что нужно": ["замена смесителя"], "Когда": ["суббота"] } });
  const r = rows(c)[0];
  assert.deepEqual([r[4], r[5], r[6], r[7], r[8], r[9]], ["WhatsApp", "Ирина", "+491765554443", "замена смесителя", "суббота", "https://wa.me/491765554443"]);
  assert.equal(c.__sent.fetch.length, 0);
});

test("morning digest counts and old finished rows are deleted", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("cleaning"), SHEET_ID: "x", LEADS_SECRET: "s", TG_BOT_TOKEN: "b" } });
  const cfg = JSON.parse(cfgFile("cleaning")); cfg.notify.telegramChatIds = ["1"]; c.__props.CONFIG_JSON = JSON.stringify(cfg);
  setNow(c, "2026-11-27T07:00:00Z");
  const post = (lead) => c.doPost({ postData: { contents: JSON.stringify({ secret: "s", lead }) } });
  post({ channel: "site", name: "A", contact: "+4911111111" });
  const sh = c.__book.getSheetByName("Leads");
  sh.appendRow([true, 9, "", new Date("2025-01-01T00:00:00Z"), "сайт", "Ancient", "", "", "", "", "нова", "", "site:x"]);
  c.__sent.fetch.length = 0;
  const d = J(c.morningDigest());
  assert.equal(d.n, 1);
  assert.match(JSON.parse(c.__sent.fetch[0].opts.payload).text, /^Без відповіді: 1\. Передзвонити: 0\./);
  assert.ok(!rows(c).some(r => r[5] === "Ancient"));
});

test("optional LLM filter: newsletters skipped, requests get a summary; mocked HTTP only", () => {
  const ths = [thread("n1", "Shop <news@shop.example>", "Black Friday", "50% off everything", "2026-11-27T06:00:00Z"),
    thread("n2", "Olga <olga@example.com>", "Hallo", "Wie viel kostet es, eine Hose zu kürzen? Bis Freitag?", "2026-11-27T06:30:00Z")];
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("other"), SHEET_ID: "x", LLM_API_KEY: "k" },
    fetch: (url, o) => {
      assert.equal(url, "https://api.anthropic.com/v1/messages");
      const b = JSON.parse(o.payload);
      assert.equal(b.model, "claude-haiku-5-5"); assert.equal(o.headers["x-api-key"], "k");
      assert.deepEqual(b.thinking, { type: "disabled" });
      const isNews = b.messages[0].content.includes("Black Friday");
      return { code: 200, body: { content: [{ type: "text", text: isNews ? '{"lead":false,"what":""}' : '{"lead":true,"what":"укоротить брюки к пятнице"}' }] } };
    }
  });
  c.GmailApp = fakeGmail(ths);
  setNow(c, "2026-11-27T07:00:00Z");
  assert.equal(c.checkMail(), 1);
  const r = rows(c);
  assert.equal(r.length, 1);
  assert.match(r[0][7], /^укоротить брюки к пятнице \| Hallo\. Wie viel/);
  assert.deepEqual([...ths[0].labels], ["Leads"], "newsletter labelled so it is not asked again");
});

test("setupLeads creates secret, sheet with localized header; files have no long dashes", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("office") } });
  assert.equal(c.setupLeads(), "ok");
  assert.equal(c.__props.LEADS_SECRET.length, 64);
  assert.deepEqual([...c.__book.getSheetByName("Leads").data[0]].slice(0, 3), ["Erledigt", "#", "Nächster Schritt"]);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(path.join(dir, ".."))) assert.ok(!DASHES.test(fs.readFileSync(f, "utf8")), "long dash in " + f);
  for (const n of ["trades", "cleaning", "office", "clinic", "fitness", "other"]) assert.ok(c.parseLeadsConfig(cfgFile(n)).business.name);
});

test("office: Telegram gets only 'new request', the e-mail alert has the details; clinic e-mail stays minimal", () => {
  const sent = [];
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("office"), SHEET_ID: "x", LEADS_SECRET: "sec", TG_BOT_TOKEN: "t" }, fetch: (u, o) => { sent.push(JSON.parse(o.payload).text); return { code: 200 }; } });
  c.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "site", name: "Anna Klein", contact: "+49171234567", what: "Buchhaltung" } }) } });
  assert.equal(sent.length, 1); assert.doesNotMatch(sent[0], /Anna/);
  assert.match(c.__sent.mail[0].body, /Anna Klein/);
  const k = loadGas(gs, { props: { CONFIG_JSON: JSON.stringify({ ...JSON.parse(cfgFile("clinic")), notify: { email: "praxis@example.com", detail: "minimal" } }), SHEET_ID: "x", LEADS_SECRET: "sec" } });
  k.doPost({ postData: { contents: JSON.stringify({ secret: "sec", lead: { channel: "site", name: "Maria", what: "Rückenschmerzen" } }) } });
  assert.doesNotMatch(k.__sent.mail[0].body, /Maria|Rücken/);
});
