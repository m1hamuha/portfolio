import test from "node:test";
import assert from "node:assert/strict";
import worker, { processWhatsApp, processChat } from "../src/index.js";
import { signatureOk, parseWebhook } from "../src/channels/whatsapp.js";
import { makeCalendar } from "../src/calendar.js";
import { fakeFetch, loadAppsScript, sign } from "./helpers.mjs";

const SECRET = "app-secret";
const J = (o) => JSON.stringify(o);
const waBody = (pid, from, text, id = `wamid.${Math.random()}`) => ({
  entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: pid }, contacts: [{ wa_id: from, profile: { name: "Max" } }], messages: [{ from, id, type: "text", text: { body: text } }] } }] }],
});
const freshEnv = (extra = {}) => ({ CHATS: kv(), LLM_PROVIDER: "mock", WA_TOKEN: "t", WA_APP_SECRET: SECRET, WA_VERIFY_TOKEN: "vt", ...extra });
function kv() { const m = new Map(); return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), delete: async (k) => void m.delete(k) }; }

test("webhook handshake and signature", async () => {
  const ok = await worker.fetch(new Request("https://w.test/wa?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=42"), freshEnv());
  assert.equal(await ok.text(), "42");
  const bad = await worker.fetch(new Request("https://w.test/wa?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42"), freshEnv());
  assert.equal(bad.status, 403);
  const raw = J({ entry: [] });
  assert.ok(await signatureOk(raw, sign(raw, SECRET), SECRET));
  assert.ok(!(await signatureOk(raw, sign(raw, "other"), SECRET)));
  const r = await worker.fetch(new Request("https://w.test/wa", { method: "POST", body: raw, headers: { "X-Hub-Signature-256": "sha256=00" } }), freshEnv());
  assert.equal(r.status, 401);
});

test("signed WhatsApp message end to end: Anthropic and Graph API mocked", async () => {
  const f = fakeFetch([
    ["https://api.anthropic.com/", () => ({ content: [{ type: "text", text: J({ lang: "en", intent: "answer", reply: "Yes, AA batteries, pack of 4: 3.50 €." }) }] })],
    ["https://graph.facebook.com/", () => ({ messages: [{ id: "out1" }] })],
  ]);
  const realFetch = globalThis.fetch; globalThis.fetch = f;
  try {
    const raw = J(waBody("000000000000005", "4917000000001", "AA batteries?"));
    const res = await worker.fetch(new Request("https://w.test/wa", { method: "POST", body: raw, headers: { "X-Hub-Signature-256": sign(raw, SECRET) } }), freshEnv({ LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" }));
    assert.equal(res.status, 200);
    const out = f.calls.find((c) => c.url.includes("graph.facebook.com"));
    assert.match(out.url, /000000000000005\/messages$/);
    assert.equal(out.body.to, "4917000000001");
    assert.match(out.body.text.body, /3\.50 €/);
  } finally { globalThis.fetch = realFetch; }
});

test("family numbers are ignored, Meta retries are answered once", async () => {
  const f = fakeFetch([["https://graph.facebook.com/", () => ({})]]);
  const env = freshEnv({ IGNORE_NUMBERS: "+49 170 0000002", MOCK_REPLIES: [J({ intent: "answer", reply: "Hallo!" })] });
  assert.equal((await processWhatsApp(waBody("000000000000005", "491700000002", "Hi Mama"), env, f)).length, 0);
  const body = waBody("000000000000005", "491700000003", "Hallo", "wamid.same");
  assert.equal((await processWhatsApp(body, env, f)).length, 1);
  assert.equal((await processWhatsApp(body, env, f)).length, 0);
});

test("owner typing in the Business app (coexistence echo) pauses the bot in that chat", async () => {
  const f = fakeFetch([["https://graph.facebook.com/", () => ({})]]);
  const env = freshEnv({ MOCK_REPLIES: [J({ intent: "answer", reply: "Hallo!" })] });
  const echo = { entry: [{ changes: [{ field: "smb_message_echoes", value: { metadata: { phone_number_id: "000000000000001" }, message_echoes: [{ from: "biz", to: "491700000004", type: "text", text: { body: "Ich melde mich" } }] } }] }] };
  assert.deepEqual(parseWebhook(echo).echoes, [{ phoneNumberId: "000000000000001", user: "491700000004" }]);
  await processWhatsApp(echo, env, f);
  assert.equal((await processWhatsApp(waBody("000000000000001", "491700000004", "Danke!"), env, f)).length, 0);
});

test("voice notes and photos get the 'please write text' answer", async () => {
  const f = fakeFetch([["https://graph.facebook.com/", () => ({})]]);
  const body = waBody("000000000000001", "491700000005", "x");
  body.entry[0].changes[0].value.messages[0] = { from: "491700000005", id: "wamid.v", type: "audio", audio: { id: "a" } };
  const sent = await processWhatsApp(body, freshEnv(), f);
  assert.equal(sent[0].intent, "nontext");
});

test("Apps Script bridge: token, busy, booking, conflict, capacity", () => {
  const gas = loadAppsScript("tok");
  assert.equal(gas.post({ token: "wrong", action: "busy" }).error, "unauthorized");
  const a = gas.post({ token: "tok", action: "book", start: "2026-12-01T08:00:00Z", end: "2026-12-01T09:00:00Z", title: "Manicure: Olga", reminderMin: 15 });
  assert.equal(a.ok, true);
  assert.deepEqual(gas.events[0].reminders, [15]);
  assert.equal(gas.post({ token: "tok", action: "book", start: "2026-12-01T08:30:00Z", end: "2026-12-01T09:30:00Z" }).conflict, true);
  assert.equal(gas.post({ token: "tok", action: "book", start: "2026-12-01T08:30:00Z", end: "2026-12-01T09:30:00Z", capacity: 2 }).ok, true);
  assert.equal(gas.post({ token: "tok", action: "busy", from: "2026-12-01T00:00:00Z", to: "2026-12-02T00:00:00Z" }).busy.length, 2);
  assert.equal(gas.post({ token: "tok", action: "book", start: "2026-12-01T10:00:00Z", end: "2026-12-01T09:00:00Z" }).error, "bad time");
});

test("site chat (office): origin check, offered times, tap + name + phone books into Google Calendar via Apps Script", async () => {
  const gas = loadAppsScript("tok");
  const f = fakeFetch([["https://script.google.com/", (body) => gas.post(body)]]);
  const env = freshEnv({ GAS_URL: "https://script.google.com/macros/s/EXAMPLE/exec", GAS_TOKEN: "tok", MOCK_REPLIES: [J({ lang: "de", intent: "slots", service_id: "call15", reply: "Die Einkommensteuererklärung kostet ab 150 €." })] });
  const req = (body, origin = "https://example.com") => new Request("https://w.test/chat", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: J(body) });
  const realFetch = globalThis.fetch; globalThis.fetch = f;
  try {
    assert.equal((await processChat(req({ biz: "office-steuer", session: "abcdefgh12", text: "x" }, "https://evil.example"), env, f)).status, 403);
    const r1 = await (await processChat(req({ biz: "office-steuer", session: "abcdefgh12", text: "Was kostet eine Steuererklärung? Kann ich anrufen?" }), env, f)).json();
    assert.equal(r1.intent, "slots");
    assert.equal(r1.slots.length, 3);
    assert.match(r1.replies.join(" "), /ab 150 €/);
    const r2 = await (await processChat(req({ biz: "office-steuer", session: "abcdefgh12", action: "book", slot_index: 1, name: "Erika Muster", phone: "+49 30 000000", text: r1.slots[0].label }), env, f)).json();
    assert.equal(r2.intent, "booked");
    assert.match(r2.replies.join(" "), /Anruf/);
    assert.equal(gas.events.length, 1);
    assert.match(gas.events[0].desc, /\+49 30 000000/);
    assert.deepEqual(gas.events[0].reminders, [15]);
  } finally { globalThis.fetch = realFetch; }
});

test("Cal.com adapter reads free slots (mocked)", async () => {
  const f = fakeFetch([["https://api.cal.com/v2/slots", () => ({ data: { "2026-12-01": [{ start: "2026-12-01T09:00:00.000+01:00" }] } })]]);
  const cal = makeCalendar({ timezone: "Europe/Berlin", booking: { calendar: "calcom", calcom_event_type_id: 1 } }, { CALCOM_API_KEY: "k" }, f);
  const free = await cal.free(new Date("2026-12-01T00:00:00Z"), new Date("2026-12-02T00:00:00Z"));
  assert.equal(free[0].toISOString(), "2026-12-01T08:00:00.000Z");
  assert.equal(f.calls[0].init.headers.Authorization, "Bearer k");
});
