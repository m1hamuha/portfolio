// Offline tests for the reminder kit. Run: node --test ops/kit/mail/test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGas, FakeEvent } from "./gas-shim.mjs";
import { buildRequests, submit } from "../whatsapp-templates/submit-templates.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const gs = ["Templates.gs", "Core.gs", "Channels.gs", "Main.gs"].map(f => path.join(dir, "../apps-script", f));
const cfgFile = n => fs.readFileSync(path.join(dir, "../config", n + ".example.json"), "utf8");
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");
const at = iso => new Date(iso);
const ev = (id, startIso, mins, title, desc = "") => new FakeEvent(id, at(startIso), new Date(at(startIso).getTime() + mins * 60000), title, desc);
const okWa = (url) => url.includes("graph.facebook.com") || url.includes("360dialog") ? { code: 200, body: { messages: [{ id: "wamid.TEST" }] } } : { code: 200, body: {} };

function withNow(ctx, iso) { ctx.Date = class extends Date { constructor(...a) { a.length ? super(...a) : super(iso); } static now() { return new Date(iso).getTime(); } }; }
function run(ctx, iso) {
  const cfg = ctx.loadConfig_();
  return JSON.parse(JSON.stringify(ctx.runJobs(cfg, at(iso), ctx.makeIo_(cfg))));
}

test("helpers: phones, dates, contact extraction", () => {
  const c = loadGas(gs);
  assert.equal(c.normalizePhone("0151 234 567 89", "49"), "4915123456789");
  assert.equal(c.normalizePhone("+380 67 123 45 67", "49"), "380671234567");
  assert.equal(c.normalizePhone("0049 30 1234567", "49"), "49301234567");
  assert.equal(c.normalizePhone("123", "49"), "");
  assert.equal(c.toDateStr("28.11.2026", "Europe/Berlin"), "2026-11-28");
  assert.equal(c.toDateStr("2026-1-5", "Europe/Berlin"), "2026-01-05");
  assert.equal(c.toTimeStr("9.30", "Europe/Berlin"), "09:30");
  const x = c.extractContact("Anna 28.11.2026 Nägel #RU +49 151 1111111 anna@example.com", "49");
  assert.equal(x.phone, "491511111111");
  assert.equal(x.email, "anna@example.com");
  assert.equal(x.lang, "ru");
  assert.equal(c.cleanName("Anna Maniküre +49 151 1111111 #ru"), "Anna Maniküre");
  assert.equal(c.localToMs("2026-07-01", "10:00", "Europe/Berlin"), Date.UTC(2026, 6, 1, 8, 0));
  assert.equal(c.localToMs("2026-12-01", "10:00", "Europe/Berlin"), Date.UTC(2026, 11, 1, 9, 0));
});

test("every text exists in ru, uk, de, en and no file of the kit has long dashes", () => {
  const c = loadGas(gs);
  for (const [k, v] of Object.entries(c.TEXTS)) for (const l of ["ru", "uk", "de", "en"]) assert.ok(v[l], `${k}.${l}`);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(path.join(dir, ".."))) assert.ok(!DASHES.test(fs.readFileSync(f, "utf8")), "long dash in " + f);
});

test("salon: WhatsApp template the day before, only with consent, once", () => {
  const events = [
    ev("e1", "2026-11-28T13:00:00Z", 60, "Anna Maniküre +49 151 1111111"),
    ev("e2", "2026-11-28T15:00:00Z", 60, "Olga 0152 2222222"),
    ev("e3", "2026-11-27T18:00:00Z", 60, "Today +49 151 3333333 #wa")
  ];
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("salon"), WA_TOKEN: "test-token", LINK_SECRET: "s" },
    sheets: { Contacts: [["Имя", "Телефон", "Почта", "Язык", "WhatsApp можно", "Акции можно", "Не писать"], ["Anna", "0151 1111111", "", "ru", "да", "", ""]] },
    events, fetch: okWa
  });
  assert.equal(run(c, "2026-11-27T14:00:00Z").sent.length, 0, "15:00 Berlin is before sendHour 17");
  const r = run(c, "2026-11-27T16:30:00Z");
  assert.deepEqual(r.sent, ["rem|e1|2026-11-28|14:00"]);
  assert.equal(r.noChannel.length, 1, "Olga has no WhatsApp consent");
  const call = c.__sent.fetch[0];
  assert.match(call.url, /graph\.facebook\.com\/v24\.0\/000000000000000\/messages$/);
  assert.equal(call.opts.headers.Authorization, "Bearer test-token");
  const body = JSON.parse(call.opts.payload);
  assert.equal(body.to, "491511111111");
  assert.equal(body.template.name, "reminder_day_before");
  assert.equal(body.template.language.code, "ru");
  assert.deepEqual(body.template.components[0].parameters.map(p => p.text), ["Anna", "28.11.", "14:00"]);
  assert.equal(run(c, "2026-11-27T17:30:00Z").sent.length, 0, "not sent twice");
  assert.equal(run(c, "2026-11-27T21:30:00Z").sent.length, 0, "no messages late in the evening");
});

test("salon: come-back invite only with offers consent and no future booking", () => {
  const events = [
    ev("p1", "2026-10-10T10:00:00Z", 60, "Sveta +49 151 4444444 #wa #promo"),
    ev("p2", "2026-10-10T12:00:00Z", 60, "Nina +49 151 5555555 #wa"),
    ev("p3", "2026-10-09T12:00:00Z", 60, "Lena +49 151 6666666 #wa #promo"),
    ev("f3", "2026-12-05T12:00:00Z", 60, "Lena +49 151 6666666 #wa #promo")
  ];
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("salon"), WA_TOKEN: "t", LINK_SECRET: "s" }, events, fetch: okWa });
  const r = run(c, "2026-11-27T11:00:00Z");
  assert.deepEqual(r.sent, ["cb|p:491514444444|2026-10-10"]);
  const body = JSON.parse(c.__sent.fetch[0].opts.payload);
  assert.equal(body.template.name, "comeback_invite");
  assert.equal(body.template.language.code, "de");
});

test("WhatsApp API error is reported to the owner, not marked as sent", () => {
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("salon"), WA_TOKEN: "t", LINK_SECRET: "s" },
    events: [ev("e1", "2026-11-28T13:00:00Z", 60, "Anna +49 151 1111111 #wa")],
    fetch: () => ({ code: 400, body: { error: { message: "Template not approved" } } })
  });
  withNow(c, "2026-11-27T16:30:00Z");
  c.hourly();
  assert.equal(c.__book.getSheetByName("Log").getLastRow(), 1);
  assert.match(c.__sent.mail[0].body, /Template not approved/);
});

test("trades: e-mail with confirm/move link, SMS fallback, web app confirm and move", () => {
  const events = [
    ev("v1", "2026-11-28T07:00:00Z", 120, "Mark Kessel tauschen", "mark@example.com #en"),
    ev("v2", "2026-11-28T10:00:00Z", 120, "Frau Weber +49 170 7777777"),
    ev("busy", "2026-11-30T07:00:00Z", 180, "Other job")
  ];
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("trades"), SMS_API_KEY: "k", LINK_SECRET: "secret", WEBAPP_URL: "https://script.google.com/macros/s/X/exec" },
    events, fetch: url => url.includes("seven.io") ? { code: 200, body: { success: "100", messages: [{ id: "77" }] } } : { code: 200 }
  });
  const r = run(c, "2026-11-27T15:10:00Z");
  assert.equal(r.sent.length, 2);
  const mail = c.__sent.mail.find(m => m.to === "mark@example.com");
  assert.match(mail.subject, /visit tomorrow at 8 am/);
  assert.match(mail.body, /Saturday Nov 28, at 8 am/);
  const url = new URL(mail.body.match(/https:\S+/)[0]);
  assert.equal(url.searchParams.get("a"), "v");
  const sms = c.__sent.fetch.find(f => f.url.includes("seven.io"));
  assert.equal(sms.opts.headers["X-Api-Key"], "k");
  const smsBody = JSON.parse(sms.opts.payload);
  assert.equal(smsBody.to, "+491707777777");
  assert.ok(smsBody.text.length <= 160 + 70, "short SMS");

  withNow(c, "2026-11-27T16:00:00Z");
  const p = Object.fromEntries(url.searchParams);
  const page = c.doGet({ parameter: p }).html;
  assert.match(page, /Confirm: Nov 28 8 am/);
  assert.ok(!page.includes("Monday Nov 30 8 am"), "busy slot hidden");
  assert.ok(!page.includes("Monday Nov 30 10:30 am"), "overlaps the busy job");
  assert.match(page, /Monday Nov 30 1:30 pm/);
  c.doGet({ parameter: { ...p, a: "vs", t: "2026-11-30T13:30" } });
  assert.match(events[0].getTitle(), /^MOVE\? /);
  assert.match(c.__sent.mail.at(-1).body, /2026-11-30 13:30/);
  c.doGet({ parameter: { ...p, a: "vc" } });
  assert.match(events[0].getTitle(), /^OK MOVE\? /);
  assert.match(c.doGet({ parameter: { ...p, s: "0000" } }).html, /Link expired/);
});

test("trades: yearly check-up e-mail with unsubscribe that works", () => {
  const events = [ev("old", "2025-12-20T09:00:00Z", 60, "Peter Wartung", "peter@example.com")];
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("trades"), LINK_SECRET: "secret", WEBAPP_URL: "https://x.test/exec" }, events });
  const r = run(c, "2026-11-27T10:00:00Z");
  assert.equal(r.sent.length, 1);
  const m = c.__sent.mail[0];
  assert.match(m.subject, /jährliche Wartung/);
  const u = new URL(m.body.match(/https:\/\/x\.test\S+/)[0]);
  assert.equal(u.searchParams.get("a"), "u");
  c.doGet({ parameter: Object.fromEntries(u.searchParams) });
  assert.equal(c.__book.getSheetByName("Optout").data[1][0], "e:peter@example.com");
  c.__book.getSheetByName("Log").data.length = 1; // even if the log was cleared
  assert.equal(run(c, "2026-11-28T10:00:00Z").sent.length, 0, "opted out");
});

test("cafe: same-day reminder from the bookings sheet via 360dialog", () => {
  const head = ["Datum", "Uhrzeit", "Name", "Telefon", "E-Mail", "Sprache", "WhatsApp OK", "Angebote OK", "Status"];
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("cafe"), WA_TOKEN: "d360", LINK_SECRET: "s" },
    sheets: { Bookings: [head,
      ["27.11.2026", "20:00", "Igor Petrov", "0176 1234567", "", "ru", "x", "", ""],
      ["27.11.2026", "11:30", "Early", "0176 7654321", "", "", "x", "", ""],
      ["27.11.2026", "19:00", "Gone", "0176 1111222", "", "", "x", "", "Storno"],
      ["20.09.2026", "19:00", "Max", "0176 5550000", "", "de", "x", "x", ""]] },
    fetch: okWa
  });
  const r = run(c, "2026-11-27T10:30:00Z");
  assert.deepEqual(r.sent.sort(), ["rem|r2@2026-11-27T20:00|2026-11-27|20:00"]);
  const f = c.__sent.fetch[0];
  assert.equal(f.url, "https://waba-v2.360dialog.io/messages");
  assert.equal(f.opts.headers["D360-API-KEY"], "d360");
  assert.equal(JSON.parse(f.opts.payload).template.name, "reminder_same_day");
  const r2 = run(c, "2026-11-27T14:30:00Z");
  assert.deepEqual(r2.sent, ["cb|p:491765550000|2026-09-20"], "Max: no booking for 2 months, agreed to offers");
});

test("fitness: weekly timetable, assist mode sends the owner tap-to-send links", () => {
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("fitness"), LINK_SECRET: "s" },
    sheets: {
      Bookings: [["Дата", "Час", "Імʼя", "Телефон", "Пошта", "Мова", "WhatsApp можна", "Акції можна", "Статус"]],
      Weekly: [["День тижня", "Час", "Імʼя", "Телефон", "Мова", "WhatsApp можна", "Акції можна"], ["Mo", "19:00", "Tom", "+49 160 1234567", "en", "так", ""], ["Di", "18:00", "Oleh", "+49 160 7654321", "uk", "так", ""]]
    }
  });
  withNow(c, "2026-11-30T09:05:00Z");
  const r = run(c, "2026-11-30T09:05:00Z");
  assert.equal(r.assist.length, 1);
  const m = c.__sent.mail[0];
  assert.equal(m.to, "owner@example.com");
  assert.match(m.subject, /Кому написати сьогодні: 1/);
  const wa = m.body.match(/https:\/\/wa\.me\/\S+/)[0];
  assert.match(wa, /^https:\/\/wa\.me\/491601234567\?text=/);
  assert.match(decodeURIComponent(wa.split("text=")[1]), /see you today at 7 pm/);
  assert.equal(run(c, "2026-11-30T11:05:00Z").assist.length, 0, "digest not repeated");
});

test("cleaning: rebook e-mail 4 weeks after the last cleaning, respects the mail quota", () => {
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("cleaning"), LINK_SECRET: "s", WEBAPP_URL: "https://x.test/exec" },
    sheets: { Clients: [["Имя", "Почта", "Телефон", "Язык", "Последний визит", "Статус"],
      ["Anna Klein", "anna@example.com", "", "de", "30.10.2026", ""],
      ["Boris", "boris@example.com", "", "ru", "2026-10-29", ""],
      ["New", "new@example.com", "", "", "10.11.2026", ""]] },
    mailQuota: 1
  });
  const r = run(c, "2026-11-27T09:30:00Z");
  assert.equal(r.sent.length, 1);
  assert.equal(r.failed.length, 1);
  assert.match(r.failed[0].error, /quota/);
  const m = c.__sent.mail[0];
  assert.equal(m.to, "boris@example.com", "oldest first");
  assert.match(m.body, /Отписаться: https:\/\/x\.test\/exec\?a=u&c=e%3Aboris/);
});

test("office: document reminders step up, stop when received, write back counters", () => {
  const head = ["Name", "E-Mail", "Sprache", "Art", "Fehlt noch", "Erhalten", "Ab Datum", "Zuletzt erinnert", "Erinnerungen"];
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("office"), LINK_SECRET: "s" },
    sheets: { Docs: [head,
      ["Herr Bauer", "bauer@example.com", "de", "", "Kontoauszüge März; Belege Tankstelle", false, "", "", ""],
      ["Frau Kim", "kim@example.com", "en", "", "Payslips", false, "", "2026-11-24", 1],
      ["Done GmbH", "done@example.com", "de", "", "X", true, "", "", ""],
      ["Ivanov", "ivanov@example.com", "ru", "Rechnung", "Счёт 2026-041, 450 EUR", false, "", "2026-11-10", 2]] }
  });
  const r = run(c, "2026-11-27T09:00:00Z");
  assert.equal(r.sent.length, 2);
  const bauer = c.__sent.mail.find(m => m.to === "bauer@example.com");
  assert.match(bauer.subject, /fehlende Unterlagen/);
  assert.match(bauer.body, /- Kontoauszüge März\n- Belege Tankstelle/);
  const iv = c.__sent.mail.find(m => m.to === "ivanov@example.com");
  assert.match(iv.subject, /напоминание об оплате/);
  assert.match(iv.body, /в ближайшие 7 дней/);
  const docs = c.__book.getSheetByName("Docs").data;
  assert.equal(docs[1][7], "2026-11-27"); assert.equal(docs[1][8], 1);
  assert.equal(docs[4][8], 3);
  assert.equal(run(c, "2026-11-28T09:00:00Z").sent.length, 0, "weekly pace");
});

test("clinic: no consent means no message; template carries only date and time", () => {
  const c = loadGas(gs, {
    props: { CONFIG_JSON: cfgFile("clinic"), WA_TOKEN: "t", LINK_SECRET: "s" },
    sheets: { Contacts: [["Name", "Telefon", "E-Mail", "Sprache", "WhatsApp OK", "Angebote OK", "Keine Nachrichten"], ["A", "+49 151 1000001", "", "de", "ja", "", ""]] },
    events: [ev("k1", "2026-11-28T09:30:00Z", 30, "A +49 151 1000001"), ev("k2", "2026-11-28T10:00:00Z", 30, "B +49 151 1000002")],
    fetch: okWa
  });
  const r = run(c, "2026-11-27T15:30:00Z");
  assert.equal(r.sent.length, 1); assert.equal(r.noChannel.length, 1);
  const body = JSON.parse(c.__sent.fetch[0].opts.payload);
  assert.deepEqual(body.template.components[0].parameters.map(p => p.text), ["28.11.", "10:30"]);
});

test("setup creates sheets, secret and the hourly trigger", () => {
  const c = loadGas(gs, { props: { CONFIG_JSON: cfgFile("office") } });
  assert.equal(c.setup(), "ok");
  assert.ok(c.__props.LINK_SECRET.length > 30);
  assert.deepEqual([...c.__book.getSheetByName("Docs").data[0]], ["Name", "E-Mail", "Sprache", "Art", "Fehlt noch", "Erhalten", "Ab Datum", "Zuletzt erinnert", "Erinnerungen"]);
});

test("all example configs parse", () => {
  const c = loadGas(gs);
  for (const n of ["salon", "cafe", "trades", "fitness", "clinic", "cleaning", "office", "other"]) assert.ok(c.parseConfig(cfgFile(n)).business.name);
  assert.throws(() => c.parseConfig("{}"), /business.name/);
});

test("WhatsApp template submission builds Meta requests (mocked HTTP)", async () => {
  const all = JSON.parse(fs.readFileSync(path.join(dir, "../whatsapp-templates/templates.json"), "utf8"));
  const reqs = buildRequests(all, "Studio X", ["reminder_day_before", "comeback_invite"], ["de", "ru"]);
  assert.equal(reqs.length, 4);
  assert.equal(reqs[0].category, "UTILITY");
  assert.match(reqs[0].components[0].text, /Studio X/);
  assert.equal(reqs[0].components[1].buttons[0].text, "Ich komme");
  const calls = [];
  const res = await submit(reqs.slice(0, 1), { token: "t", wabaId: "123", fetchImpl: async (u, o) => { calls.push([u, o]); return { ok: true, status: 200, json: async () => ({ status: "PENDING" }) }; } });
  assert.equal(calls[0][0], "https://graph.facebook.com/v24.0/123/message_templates");
  assert.equal(res[0].status, "PENDING");
});
