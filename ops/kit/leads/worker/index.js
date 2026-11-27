// Leads Worker: one per client. Turns incoming messages into rows of the client's Google Sheet
// by POSTing to the Apps Script web app (LeadsMain.gs doPost).
//   POST /form       site form (JSON, urlencoded or multipart), honeypot + origin check + rate limit
//   GET  /meta       Meta webhook verification (Instagram, Facebook Page, WhatsApp Cloud API)
//   POST /meta       Meta webhook events, signature checked with META_APP_SECRET
//   POST /telegram   Telegram bot updates (business_message from a connected business bot, or direct bot chats)
// Secrets (wrangler secret put ...): LEADS_SECRET, META_APP_SECRET, META_VERIFY_TOKEN, TG_SECRET, IG_TOKEN, LLM_API_KEY
// Vars (wrangler.toml): APPS_SCRIPT_URL, ALLOWED_ORIGINS, THANKS_URL, TG_OWNER_ID, LANG, SUMMARY, SUMMARY_MODEL, HEALTH, IG_API_VERSION

const enc = new TextEncoder();
const hits = new Map(); // per-isolate burst guard for the public form

export async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, typeof body === "string" ? enc.encode(body) : body);
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
export function normPhone(raw, cc = "49") {
  let s = String(raw || "").replace(/[^\d+]/g, "");
  if (!s) return "";
  if (s[0] === "+") s = s.slice(1); else if (s.startsWith("00")) s = s.slice(2); else if (s[0] === "0") s = cc + s.slice(1);
  s = s.replace(/\D/g, "");
  return s.length >= 8 && s.length <= 15 ? s : "";
}

/* ---------- Meta payloads -> leads ---------- */
export function metaToLeads(p) {
  const out = [];
  if (p.object === "instagram" || p.object === "page") {
    for (const e of p.entry || []) for (const m of e.messaging || []) {
      if (!m.message || m.message.is_echo || m.message.is_deleted) continue;
      if (m.sender && String(m.sender.id) === String(e.id)) continue; // own account
      const text = m.message.text || (m.message.attachments ? "[" + (m.message.attachments[0].type || "file") + "]" : "");
      const ig = p.object === "instagram";
      out.push({ channel: ig ? "instagram" : "facebook", senderId: m.sender.id, name: ig ? "Instagram" : "Facebook", contact: "", what: text, externalId: m.sender.id,
        open: ig ? "https://www.instagram.com/direct/inbox/" : "https://business.facebook.com/latest/inbox/all" });
    }
  }
  if (p.object === "whatsapp_business_account") {
    for (const e of p.entry || []) for (const ch of e.changes || []) {
      if (ch.field !== "messages") continue; // "smb_message_echoes" = the owner's own replies from the app
      const v = ch.value || {};
      const names = Object.fromEntries((v.contacts || []).map(c => [c.wa_id, (c.profile && c.profile.name) || ""]));
      for (const m of v.messages || []) {
        const text = (m.text && m.text.body) || (m.button && m.button.text) || (m.interactive && ((m.interactive.button_reply || m.interactive.list_reply || {}).title)) || "[" + m.type + "]";
        out.push({ channel: "whatsapp", name: names[m.from] || "", contact: "+" + m.from, what: text, open: "https://wa.me/" + m.from, externalId: m.from });
      }
    }
  }
  return out;
}

/* ---------- Telegram update -> lead ---------- */
export function telegramToLead(u, env) {
  const m = u.business_message || u.message;
  if (!m || !m.from || m.from.is_bot) return null;
  if (u.business_message && String(m.from.id) === String(env.TG_OWNER_ID || "")) return null; // the owner's own reply
  if (u.message && (m.chat.type !== "private" || /^\/start/.test(m.text || ""))) return null;
  const name = clip([m.from.first_name, m.from.last_name].filter(Boolean).join(" "), 60);
  return {
    channel: "telegram", name, contact: m.from.username ? "@" + m.from.username : "",
    what: m.text || m.caption || "[" + (m.photo ? "photo" : m.voice ? "voice" : m.document ? "file" : "message") + "]",
    open: m.from.username ? "https://t.me/" + m.from.username : "tg://user?id=" + m.from.id, externalId: String(m.from.id)
  };
}

/* ---------- optional one-line summary (provider swappable, off by default, never with HEALTH=1) ---------- */
const LANGS = { ru: "Russian", uk: "Ukrainian", de: "German", en: "English" };
export const PROVIDERS = {
  async anthropic(text, env, f) {
    const r = await f("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.LLM_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: env.SUMMARY_MODEL || "claude-haiku-5-5", max_tokens: 60,
        system: `Summarize what this customer wants in at most 8 words in ${LANGS[env.LANG] || "German"}. No names, no phone numbers, no greetings. Output only the summary.`,
        messages: [{ role: "user", content: String(text).slice(0, 2000) }]
      })
    });
    if (!r.ok) return "";
    const j = await r.json();
    return (j.content || []).map(c => c.text || "").join("").trim();
  }
};
export async function summarize(text, env, f = fetch) {
  if (!env.SUMMARY || env.SUMMARY === "off" || env.HEALTH === "1" || !PROVIDERS[env.SUMMARY] || String(text).length < 60) return "";
  try { return clip(await PROVIDERS[env.SUMMARY](text, env, f), 80); } catch (e) { return ""; }
}

/* ---------- delivery to the sheet ---------- */
async function enrich(lead, env, f) {
  if (lead.channel === "instagram" && env.IG_TOKEN && lead.senderId) {
    try {
      const r = await f(`https://graph.instagram.com/${env.IG_API_VERSION || "v24.0"}/${encodeURIComponent(lead.senderId)}?fields=name,username&access_token=${encodeURIComponent(env.IG_TOKEN)}`);
      if (r.ok) { const j = await r.json(); if (j.username) { lead.name = j.name || j.username; lead.contact = "@" + j.username; lead.open = "https://ig.me/m/" + j.username; } }
    } catch (e) { /* keep the generic inbox link */ }
  }
  const s = await summarize(lead.what, env, f);
  if (s) lead.what = s + " | " + lead.what;
  delete lead.senderId;
  return lead;
}
export async function forward(lead, env, f = fetch) {
  const clean = { channel: lead.channel, name: clip(lead.name, 60), contact: clip(lead.contact, 80), what: clip(lead.what, 300), when: clip(lead.when, 60), open: clip(lead.open, 300), externalId: clip(lead.externalId, 120) };
  const r = await f(env.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: env.LEADS_SECRET, lead: clean }), redirect: "follow" });
  return r.ok;
}
async function deliverAll(leads, env, f) {
  for (const l of leads) {
    const ok = await forward(await enrich(l, env, f), env, f);
    if (!ok) console.log("forward failed", l.channel);
  }
}

/* ---------- site form ---------- */
async function readForm(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return { data: await req.json(), html: false };
  const fd = await req.formData();
  return { data: Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])), html: true };
}
async function handleForm(req, env, ctx, f) {
  const origin = req.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const cors = origin && allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  if (origin && !allowed.includes(origin)) return new Response("forbidden", { status: 403 });
  const ip = req.headers.get("CF-Connecting-IP") || "x", now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000); list.push(now); hits.set(ip, list);
  if (list.length > 5) return new Response("slow down", { status: 429, headers: cors });
  let form;
  try { form = await readForm(req); } catch (e) { return new Response("bad request", { status: 400, headers: cors }); }
  const d = form.data || {};
  const done = () => form.html && env.THANKS_URL ? Response.redirect(env.THANKS_URL, 303) : Response.json({ ok: true }, { headers: cors });
  if (d.website) return done(); // honeypot: bots fill every field, humans never see this one
  const phone = normPhone(d.phone, env.COUNTRY_CODE || "49");
  const email = /^[^@\s]{1,64}@[^@\s]{1,255}\.[a-z]{2,}$/i.test(d.email || "") ? String(d.email).toLowerCase() : "";
  if (!phone && !email) return Response.json({ ok: false, error: "phone or email required" }, { status: 400, headers: cors });
  const lead = {
    channel: "site", name: clip(d.name, 60), contact: [phone ? "+" + phone : "", email].filter(Boolean).join(", "),
    what: clip(d.message || d.what, 600), when: clip(d.when || d.day, 60),
    open: phone ? "https://wa.me/" + phone : "mailto:" + email, externalId: phone || email
  };
  ctx.waitUntil(deliverAll([lead], env, f));
  return done();
}

export default {
  async fetch(req, env, ctx, f = fetch) {
    const url = new URL(req.url);
    if (url.pathname === "/form") return handleForm(req, env, ctx, f);
    if (url.pathname === "/meta" && req.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" && safeEqual(url.searchParams.get("hub.verify_token"), env.META_VERIFY_TOKEN);
      return ok ? new Response(url.searchParams.get("hub.challenge") || "") : new Response("forbidden", { status: 403 });
    }
    if (url.pathname === "/meta" && req.method === "POST") {
      const raw = await req.text();
      const sig = (req.headers.get("X-Hub-Signature-256") || "").replace(/^sha256=/, "");
      if (!env.META_APP_SECRET || !safeEqual(sig, await hmacHex(env.META_APP_SECRET, raw))) return new Response("bad signature", { status: 401 });
      let p; try { p = JSON.parse(raw); } catch (e) { return new Response("bad json", { status: 400 }); }
      ctx.waitUntil(deliverAll(metaToLeads(p), env, f));
      return new Response("EVENT_RECEIVED");
    }
    if (url.pathname === "/telegram" && req.method === "POST") {
      if (!env.TG_SECRET || !safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), env.TG_SECRET)) return new Response("forbidden", { status: 403 });
      const lead = telegramToLead(await req.json(), env);
      if (lead) ctx.waitUntil(deliverAll([lead], env, f));
      return new Response("ok");
    }
    return new Response("not found", { status: 404 });
  }
};
