import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/core.js";
import { makeLLM } from "../src/llm.js";
import { makeCalendar } from "../src/calendar.js";
import { makeNotifier } from "../src/notify.js";
import { memoryStore } from "../src/store.js";
import { computeSlots, zonedToDate, localParts } from "../src/time.js";
import { pricesOk, timesOk, mentionsHealth } from "../src/guard.js";
import { systemPrompt } from "../src/prompt.js";
import { byId } from "../businesses/index.js";
import { clone, fakeFetch } from "./helpers.mjs";

/* Friday 27 Nov 2026, 21:00 in Berlin: the "night" message */
const NOW = new Date("2026-11-27T20:00:00Z");

function setup(id, replies, extra = {}) {
  const biz = clone(byId(id));
  if (biz.booking.calendar && biz.booking.calendar !== "none") biz.booking.calendar = "memory";
  Object.assign(biz, extra.biz || {});
  const notified = [];
  const ctx = {
    biz, now: NOW, store: memoryStore(),
    llm: makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLIES: replies }),
    calendar: makeCalendar(biz, {}),
    notify: async (t) => notified.push(t),
  };
  return { biz, ctx, notified };
}
const J = (o) => JSON.stringify(o);

test("time: Berlin local time to UTC across DST", () => {
  assert.equal(zonedToDate("2026-11-28", "11:00", "Europe/Berlin").toISOString(), "2026-11-28T10:00:00.000Z");
  assert.equal(zonedToDate("2026-07-01", "11:00", "Europe/Berlin").toISOString(), "2026-07-01T09:00:00.000Z");
  assert.equal(localParts(NOW, "Europe/Berlin").hm, "21:00");
});

test("time: free slots skip busy events and respect capacity", () => {
  const hours = { sat: ["10:00-12:00"] };
  const busy = [{ start: "2026-11-28T09:00:00Z", end: "2026-11-28T10:00:00Z" }]; /* 10:00-11:00 local */
  const s = computeSlots({ ymd: "2026-11-28", hours, tz: "Europe/Berlin", durationMin: 60, stepMin: 30, busy });
  assert.deepEqual(s.map((d) => localParts(d, "Europe/Berlin").hm), ["11:00"]);
  const s2 = computeSlots({ ymd: "2026-11-28", hours, tz: "Europe/Berlin", durationMin: 60, stepMin: 30, busy, capacity: 2 });
  assert.equal(s2.length, 3);
});

test("salon: night message gets real free times, a number books into the calendar", async () => {
  const { ctx, biz } = setup("salon-lila", [J({ lang: "ru", intent: "slots", service_id: "manicure", part_of_day: "any", reply: "" })]);
  const r1 = await handle({ channel: "whatsapp", user: "4915100000001", name: "Olga", text: "Здравствуйте, есть время на маникюр в субботу?" }, ctx);
  assert.equal(r1.intent, "slots");
  assert.match(r1.replies[0], /Автоматический помощник/); /* AI Act disclosure on first contact */
  assert.match(r1.replies.join("\n"), /1\) .*10:00/);
  const r2 = await handle({ channel: "whatsapp", user: "4915100000001", name: "Olga", text: "1" }, ctx);
  assert.equal(r2.intent, "booked");
  assert.match(r2.replies[0], /Готово: Маникюр/);
  assert.equal(biz.__events.length, 1);
  assert.equal(biz.__events[0].start, "2026-11-28T09:00:00.000Z");
  assert.match(biz.__events[0].description, /wa\.me\/4915100000001/);
});

test("salon: a time taken in between is not double-booked", async () => {
  const { ctx, biz } = setup("salon-lila", [J({ lang: "de", intent: "slots", service_id: "gel", reply: "" })]);
  await handle({ channel: "whatsapp", user: "49151", text: "Gel-Nägel Termin?" }, ctx);
  biz.__events.push({ start: "2026-11-28T09:00:00.000Z", end: "2026-11-28T11:00:00.000Z", title: "walk-in" });
  const r = await handle({ channel: "whatsapp", user: "49151", text: "1" }, ctx);
  assert.equal(r.intent, "slot_taken");
  assert.match(r.replies[0], /gerade vergeben/);
});

test("guards: wrong sums and invented times go to the owner, not to the customer", async () => {
  const biz = byId("salon-lila");
  assert.ok(pricesOk("Maniküre kostet 35 €.", biz));
  assert.ok(!pricesOk("Maniküre kostet 25 €.", biz));
  assert.ok(timesOk("Parken ist ab 18:00 frei.", biz));
  assert.ok(!timesOk("Samstag 11:30 ist frei.", biz));
  const { ctx, notified } = setup("salon-lila", [J({ lang: "de", intent: "answer", reply: "Heute 20% Rabatt, nur 25 €!" })]);
  const r = await handle({ channel: "whatsapp", user: "49152", text: "Preis Maniküre?" }, ctx);
  assert.equal(r.intent, "handover");
  assert.ok(!/25/.test(r.replies.join(" ")));
  assert.equal(notified.length, 1);
});

test("shop: answers stock and price from the list", async () => {
  const { ctx } = setup("shop-eck", [J({ lang: "en", intent: "answer", reply: "Yes, AA batteries, pack of 4: 3.50 €. Open until 19:00 today." })]);
  const r = await handle({ channel: "whatsapp", user: "49153", text: "do you have AA batteries?" }, ctx);
  assert.equal(r.intent, "answer");
  assert.match(r.replies.join(" "), /3\.50 €/);
});

test("cafe: table booked when free, refused when all tables taken", async () => {
  const ask = J({ lang: "de", intent: "table", date: "2026-11-28", time: "19:00", people: 4, guest_name: "Marina", reply: "" });
  const { ctx, biz, notified } = setup("cafe-olive", [ask]);
  const r = await handle({ channel: "whatsapp", user: "49154", text: "Tisch morgen 19 Uhr, 4 Personen, Marina" }, ctx);
  assert.equal(r.intent, "table_ok");
  assert.match(r.replies.join(" "), /4 Personen/);
  assert.match(notified[0], /Marina, 4 people/);
  for (let i = 0; i < 5; i++) biz.__events.push({ start: "2026-11-28T18:00:00.000Z", end: "2026-11-28T20:00:00.000Z", title: "x" });
  const r2 = await handle({ channel: "whatsapp", user: "49155", text: "Tisch morgen 19 Uhr für 4, Name Ali" }, { ...ctx, llm: makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLIES: [ask.replace("Marina", "Ali")] }) });
  assert.equal(r2.intent, "table_full");
  assert.match(r2.replies.join(" "), /alle Tische belegt/);
});

test("cafe: missing details are asked for, big groups go to the owner", async () => {
  const { ctx } = setup("cafe-olive", [J({ lang: "en", intent: "table", date: "2026-11-28", time: null, people: 2, guest_name: null, reply: "" })]);
  const r = await handle({ channel: "whatsapp", user: "49156", text: "table tomorrow for two" }, ctx);
  assert.equal(r.intent, "table_need");
  const { ctx: c2 } = setup("cafe-olive", [J({ lang: "en", intent: "table", date: "2026-11-28", time: "19:00", people: 14, guest_name: "Team", reply: "" })]);
  assert.equal((await handle({ channel: "whatsapp", user: "49157", text: "table for 14" }, c2)).intent, "handover");
});

test("fitness: trial times from the timetable, owner gets 'New trial' on WhatsApp, template when 24h window is closed", async () => {
  const biz = clone(byId("fitness-move"));
  const f = fakeFetch([["https://graph.facebook.com/", (body) => (body.type === "text" ? { __status: 400, error: { code: 131047, message: "Re-engagement message" } } : { messages: [{ id: "x" }] })]]);
  const ctx = {
    biz, now: NOW, store: memoryStore(), calendar: makeCalendar(biz, {}),
    llm: makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLIES: [J({ lang: "ru", intent: "slots", service_id: "trial", reply: "Пробное бесплатно." })] }),
    notify: makeNotifier(biz, { WA_TOKEN: "t", OWNER_WA: "4915199999999", WA_OWNER_TEMPLATE: "owner_alert" }, f),
  };
  const r1 = await handle({ channel: "whatsapp", user: "49158", name: "Anna", text: "Сколько стоит пробное? Можно утром?" }, ctx);
  assert.equal(r1.intent, "slots");
  assert.match(r1.replies.join("\n"), /Functional 7:30|Yoga 9:00/);
  const r2 = await handle({ channel: "whatsapp", user: "49158", name: "Anna", text: "1" }, ctx);
  assert.equal(r2.intent, "booked");
  const sent = f.calls.map((c) => c.body.type);
  assert.deepEqual(sent, ["text", "template"]);
  assert.equal(f.calls[1].body.template.name, "owner_alert");
  assert.match(f.calls[1].body.template.components[0].parameters[0].text, /new booking: Anna/);
});

test("clinic: health questions never reach the model", async () => {
  const { ctx, notified } = setup("clinic-zahn", () => { throw new Error("model must not be called"); });
  const r = await handle({ channel: "whatsapp", user: "49159", text: "Mein Zahnfleisch blutet, was soll ich nehmen?" }, ctx);
  assert.equal(r.intent, "health");
  assert.match(r.replies.join(" "), /116117/);
  assert.ok(!/blutet/.test(notified[0]));
  assert.ok(mentionsHealth("у меня болит зуб"));
});

test("clinic: price question answered, wish for a time becomes a request for the morning", async () => {
  const { ctx, notified } = setup("clinic-zahn", [
    J({ lang: "en", intent: "answer", reply: "A professional cleaning is 90 euros. Which day and time suit you?" }),
    J({ lang: "en", intent: "request", summary: "cleaning, Friday morning", reply: "" }),
  ]);
  const r1 = await handle({ channel: "whatsapp", user: "49160", text: "How much is a cleaning?" }, ctx);
  assert.equal(r1.intent, "answer");
  const r2 = await handle({ channel: "whatsapp", user: "49160", text: "Friday morning" }, ctx);
  assert.equal(r2.intent, "request");
  assert.match(notified[0], /cleaning, Friday morning/);
});

test("prompt carries only business facts and the JSON contract", () => {
  const p = systemPrompt(byId("office-steuer"), { channel: "web", now: NOW, lang: "de" });
  assert.match(p, /Einkommensteuererklärung: from 150 EUR/);
  assert.match(p, /Never write a free time/);
  assert.ok(!/[\u2013\u2014]/.test(p));
});

test("anthropic provider: request shape and text extraction (mocked HTTP)", async () => {
  const f = fakeFetch([["https://api.anthropic.com/v1/messages", () => ({ content: [{ type: "thinking", thinking: "" }, { type: "text", text: "{\"intent\":\"answer\"}" }], stop_reason: "end_turn" })]]);
  const llm = makeLLM({ ANTHROPIC_API_KEY: "test-key" }, f);
  const out = await llm.complete({ system: "s", messages: [{ role: "user", content: "hi" }] });
  assert.equal(out, "{\"intent\":\"answer\"}");
  const c = f.calls[0];
  assert.equal(c.init.headers["x-api-key"], "test-key");
  assert.equal(c.init.headers["anthropic-version"], "2023-06-01");
  assert.equal(c.body.model, "claude-haiku-5-5");
  assert.equal(c.body.output_config.effort, "low");
});

test("model failure: customer gets a polite fallback, owner is told", async () => {
  const { ctx, notified } = setup("shop-eck", () => { throw new Error("500"); });
  const r = await handle({ channel: "whatsapp", user: "49161", text: "hello?" }, ctx);
  assert.equal(r.intent, "error");
  assert.equal(notified.length, 1);
});
