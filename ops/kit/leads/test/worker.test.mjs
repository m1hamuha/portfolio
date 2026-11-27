// Offline tests for the leads Worker. All HTTP is mocked; global fetch throws if anything escapes.
import test from "node:test";
import assert from "node:assert/strict";
import worker, { hmacHex, metaToLeads, telegramToLead, summarize } from "../worker/index.js";

globalThis.fetch = async () => { throw new Error("real network call in a test"); };

const ENV = {
  APPS_SCRIPT_URL: "https://script.google.test/exec", LEADS_SECRET: "lead-secret", ALLOWED_ORIGINS: "https://client.example",
  THANKS_URL: "https://client.example/danke", META_APP_SECRET: "app-secret", META_VERIFY_TOKEN: "verify-me",
  TG_SECRET: "tg-secret", TG_OWNER_ID: "1000", LANG: "de", SUMMARY: "off"
};
function harness(env = ENV, handler = () => ({ ok: true, body: {} })) {
  const calls = [], waits = [];
  const f = async (url, opts = {}) => { calls.push({ url, opts }); const r = handler(url, opts); return { ok: r.ok !== false, status: r.ok === false ? 500 : 200, json: async () => r.body }; };
  const ctx = { waitUntil: p => waits.push(p) };
  const call = async (req) => { const res = await worker.fetch(req, env, ctx, f); await Promise.all(waits); return res; };
  const forwarded = () => calls.filter(c => c.url === env.APPS_SCRIPT_URL).map(c => JSON.parse(c.opts.body));
  return { call, calls, forwarded };
}
const metaReq = async (payload, secret = "app-secret") => {
  const raw = JSON.stringify(payload);
  return new Request("https://w.test/meta", { method: "POST", body: raw, headers: { "X-Hub-Signature-256": "sha256=" + await hmacHex(secret, raw) } });
};

test("Meta webhook verification", async () => {
  const h = harness();
  let r = await h.call(new Request("https://w.test/meta?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123"));
  assert.equal(await r.text(), "123");
  r = await h.call(new Request("https://w.test/meta?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123"));
  assert.equal(r.status, 403);
});

test("Instagram DM: signature checked, echo ignored, username looked up, row forwarded", async () => {
  const h = harness({ ...ENV, IG_TOKEN: "igt" }, url => url.startsWith("https://graph.instagram.com/") ? { body: { username: "anna.fit", name: "Anna" } } : { body: {} });
  const payload = { object: "instagram", entry: [{ id: "IGBIZ", messaging: [
    { sender: { id: "IGSID1" }, recipient: { id: "IGBIZ" }, message: { mid: "1", text: "Hi, I want a trial session" } },
    { sender: { id: "IGBIZ" }, recipient: { id: "IGSID1" }, message: { mid: "2", text: "Sure!", is_echo: true } }
  ] }] };
  const bad = await h.call(await metaReq(payload, "other"));
  assert.equal(bad.status, 401);
  const ok = await h.call(await metaReq(payload));
  assert.equal(ok.status, 200);
  const f = h.forwarded();
  assert.equal(f.length, 1);
  assert.equal(f[0].secret, "lead-secret");
  assert.deepEqual(f[0].lead, { channel: "instagram", name: "Anna", contact: "@anna.fit", what: "Hi, I want a trial session", when: "", open: "https://ig.me/m/anna.fit", externalId: "IGSID1" });
});

test("WhatsApp Cloud API: customer messages only, not statuses or the owner's echoes", () => {
  const leads = metaToLeads({ object: "whatsapp_business_account", entry: [{ changes: [
    { field: "messages", value: { contacts: [{ wa_id: "4917012345", profile: { name: "Anna" } }], messages: [{ from: "4917012345", type: "text", text: { body: "Preis für 3 Stück?" } }] } },
    { field: "messages", value: { statuses: [{ id: "x", status: "read" }] } },
    { field: "smb_message_echoes", value: { message_echoes: [{ from: "4930111", text: { body: "Hallo!" } }] } }
  ] }] });
  assert.deepEqual(leads, [{ channel: "whatsapp", name: "Anna", contact: "+4917012345", what: "Preis für 3 Stück?", open: "https://wa.me/4917012345", externalId: "4917012345" }]);
  const fb = metaToLeads({ object: "page", entry: [{ id: "PAGE", messaging: [{ sender: { id: "PSID" }, message: { text: "Termin?" } }] }] });
  assert.equal(fb[0].channel, "facebook");
});

test("Telegram business chats: customer in, owner's replies out, secret header required", async () => {
  const h = harness();
  const upd = { business_message: { business_connection_id: "bc", chat: { id: 5, type: "private" }, from: { id: 5, first_name: "Oleg", username: "oleg_k" }, text: "Сколько стоит подшить?" } };
  let r = await h.call(new Request("https://w.test/telegram", { method: "POST", body: JSON.stringify(upd) }));
  assert.equal(r.status, 403);
  r = await h.call(new Request("https://w.test/telegram", { method: "POST", body: JSON.stringify(upd), headers: { "X-Telegram-Bot-Api-Secret-Token": "tg-secret" } }));
  assert.equal(r.status, 200);
  assert.equal(h.forwarded()[0].lead.open, "https://t.me/oleg_k");
  assert.equal(telegramToLead({ business_message: { ...upd.business_message, from: { id: 1000, first_name: "Owner" } } }, ENV), null);
});

test("site form: honeypot, origin, validation, redirect, burst guard", async () => {
  const h = harness();
  const form = (fields, headers = {}) => new Request("https://w.test/form", { method: "POST", body: new URLSearchParams(fields), headers: { Origin: "https://client.example", "CF-Connecting-IP": "9.9.9.9", ...headers } });
  let r = await h.call(form({ name: "Bot", phone: "0171 1", website: "spam.example" }));
  assert.equal(r.status, 303); assert.equal(h.forwarded().length, 0);
  r = await h.call(form({ name: "X", phone: "0171 2345678" }, { Origin: "https://evil.example" }));
  assert.equal(r.status, 403);
  r = await h.call(form({ name: "No contact" }));
  assert.equal(r.status, 400);
  r = await h.call(form({ name: "Anna Klein", phone: "0171 234 567 8", message: "Laden, braucht Buchhaltung", when: "Mo" }));
  assert.equal(r.status, 303); assert.equal(r.headers.get("Location"), "https://client.example/danke");
  assert.deepEqual(h.forwarded()[0].lead, { channel: "site", name: "Anna Klein", contact: "+491712345678", what: "Laden, braucht Buchhaltung", when: "Mo", open: "https://wa.me/491712345678", externalId: "491712345678" });
  r = await h.call(new Request("https://w.test/form", { method: "POST", body: JSON.stringify({ name: "J", email: "j@example.com" }), headers: { "Content-Type": "application/json", "CF-Connecting-IP": "8.8.8.8" } }));
  assert.equal((await r.json()).ok, true);
  let last;
  for (let i = 0; i < 7; i++) last = await h.call(form({ name: "n", phone: "0171 2345678" }, { "CF-Connecting-IP": "7.7.7.7" }));
  assert.equal(last.status, 429);
});

test("summary: Anthropic request shape, fallback on error, never with HEALTH=1", async () => {
  const long = "Hallo, ich hätte gern ein Probetraining am Samstag, wenn möglich mit Trainerin, und frage nach Preisen.";
  const calls = [];
  const f = async (url, o) => { calls.push({ url, o }); return { ok: true, json: async () => ({ content: [{ type: "text", text: "Probetraining Samstag, Preise" }] }) }; };
  assert.equal(await summarize(long, { SUMMARY: "anthropic", LLM_API_KEY: "k", LANG: "de" }, f), "Probetraining Samstag, Preise");
  const b = JSON.parse(calls[0].o.body);
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages");
  assert.equal(b.model, "claude-haiku-5-5"); assert.equal(calls[0].o.headers["anthropic-version"], "2023-06-01");
  assert.equal(await summarize(long, { SUMMARY: "anthropic", LLM_API_KEY: "k", HEALTH: "1" }, f), "");
  assert.equal(calls.length, 1);
  assert.equal(await summarize(long, { SUMMARY: "anthropic", LLM_API_KEY: "k" }, async () => { throw new Error("down"); }), "");
});
