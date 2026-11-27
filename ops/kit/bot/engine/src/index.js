/* Cloudflare Worker: one engine, two doors.
   /wa    WhatsApp Cloud API webhook (GET handshake, POST messages)
   /chat  site chat widget (widget/widget.js)
   Config: businesses/*.json, picked by WhatsApp phone_number_id or by "biz" in the chat request.
   Secrets: ANTHROPIC_API_KEY, WA_TOKEN, WA_APP_SECRET, WA_VERIFY_TOKEN, GAS_URL, GAS_TOKEN,
            CALCOM_API_KEY, TG_TOKEN, TG_CHAT_ID, OWNER_WA, IGNORE_NUMBERS (all optional per set-up). */
import { handle, pauseChat } from "./core.js";
import { makeLLM } from "./llm.js";
import { makeCalendar } from "./calendar.js";
import { makeNotifier } from "./notify.js";
import { storeFor } from "./store.js";
import { verifyHandshake, signatureOk, parseWebhook, sendText } from "./channels/whatsapp.js";
import { BUSINESSES, byId, byPhoneNumberId } from "../businesses/index.js";

const hits = new Map();

function deps(biz, env, fetchImpl) {
  return { biz, llm: makeLLM(env, fetchImpl), calendar: makeCalendar(biz, env, fetchImpl), notify: makeNotifier(biz, env, fetchImpl), store: storeFor(env) };
}

function ignored(env, user) {
  return String(env.IGNORE_NUMBERS || "").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean).includes(String(user).replace(/\D/g, ""));
}

export async function processWhatsApp(body, env, fetchImpl = fetch) {
  const { incoming, echoes } = parseWebhook(body);
  const store = storeFor(env);
  const sent = [];
  for (const e of echoes) {
    const biz = byPhoneNumberId(e.phoneNumberId) || byId(env.BUSINESS_ID);
    if (biz) await pauseChat(store, biz, e.user);
  }
  for (const m of incoming) {
    const biz = byPhoneNumberId(m.phoneNumberId) || byId(env.BUSINESS_ID);
    if (!biz || ignored(env, m.user)) continue;
    if (await store.get(`d:${m.id}`)) continue; /* Meta retries webhooks: answer once */
    await store.put(`d:${m.id}`, 1, 3 * 86400);
    const d = deps(biz, env, fetchImpl);
    const r = await handle({ channel: "whatsapp", user: m.user, name: m.name, text: m.text, type: m.type }, d);
    if (r.replies.length) {
      const text = r.replies.join("\n\n");
      let s;
      try { s = await sendText(env, biz.whatsapp_phone_number_id || m.phoneNumberId, m.user, text, fetchImpl); }
      catch (e) { s = { ok: false, status: 0, data: { error: { message: e.message } } }; }
      if (!s.ok) {
        /* the answer did not leave (token expired, number blocked...): the owner must answer by hand */
        console.log("wa send failed", s.status, JSON.stringify(s.data).slice(0, 300));
        try { await d.notify(`${biz.name}: the bot could not send its answer to wa.me/${m.user} (error ${s.status}). Please answer in WhatsApp.`); } catch (e) { console.log("notify failed", e.message); }
      }
      sent.push({ to: m.user, text, intent: r.intent, ok: s.ok });
    }
  }
  return sent;
}

function cors(biz, req) {
  const o = req.headers.get("Origin") || "";
  const allow = biz ? biz.site_origins || [] : BUSINESSES.flatMap((b) => b.site_origins || []);
  return { "Access-Control-Allow-Origin": allow.includes(o) ? o : allow[0] || "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
}
const json = (b, s, h) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", ...h } });

export async function processChat(req, env, fetchImpl = fetch) {
  let body; try { body = await req.json(); } catch { return json({ error: "json" }, 400, {}); }
  const biz = byId(body.biz || env.BUSINESS_ID);
  const h = cors(biz, req);
  if (!biz || !biz.site_origins) return json({ error: "business" }, 404, h);
  const origin = req.headers.get("Origin") || "";
  if (!biz.site_origins.includes(origin)) return json({ error: "origin" }, 403, h);
  const ip = req.headers.get("CF-Connecting-IP") || "x"; const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000); list.push(now); hits.set(ip, list);
  if (list.length > 20) return json({ error: "slow down" }, 429, h);
  const session = String(body.session || "").replace(/[^\w-]/g, "").slice(0, 40);
  if (session.length < 8) return json({ error: "session" }, 400, h);
  const d = deps(biz, env, fetchImpl);
  const r = await handle({ channel: "web", user: `web-${session}`, text: String(body.text || "").slice(0, 1000), lang: body.lang,
    action: body.action === "book" ? "book" : undefined, slot_index: +body.slot_index || null,
    name: String(body.name || "").slice(0, 80), phone: String(body.phone || "").slice(0, 40) }, d);
  const pending = r.intent === "slots" || r.intent === "slot_taken" ? await d.store.get(`p:${biz.id}:web-${session}`) : null;
  return json({ replies: r.replies, intent: r.intent, slots: pending ? pending.slots.map((s, i) => ({ index: i + 1, label: s.label })) : [] }, 200, h);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/wa" && req.method === "GET") return verifyHandshake(url, env);
    if (url.pathname === "/wa" && req.method === "POST") {
      const raw = await req.text();
      if (!(await signatureOk(raw, req.headers.get("X-Hub-Signature-256"), env.WA_APP_SECRET))) return new Response("bad signature", { status: 401 });
      let body; try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
      const job = processWhatsApp(body, env).catch((e) => console.log("wa error", e.message));
      if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
      return new Response("ok");
    }
    if (url.pathname === "/chat") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(null, req) });
      if (req.method === "POST") return processChat(req, env);
    }
    if (url.pathname === "/health") return new Response("ok");
    return new Response("not found", { status: 404 });
  },
};
