/* Phone app backend for the salon (and any client with "delivery": "app").
   One Worker serves the app files (../../app, static assets) and one small API:
     GET  /api/me        -> { name, ui_language, used, daily_limit }
     POST /api/caption   -> { caption, status_text, alt, hashtags, problems }   body: { images: [{media_type, data}], note }
   Term: app.captions_until (YYYY-MM-DD, set at install, 12 months by default). After that day /api/caption answers
   402 "term_over"; the photo and clip work runs on the phone and keeps working. Extending = a new date in CLIENTS.
   Auth: "Authorization: Bearer <app token>". The Worker keeps only sha256 of tokens (secret CLIENTS).
   Photos are not stored: they go to the model for the caption and are dropped. The app does the photo work on the phone. */
import { makeLLM } from "../../../social/src/llm.mjs";
import { captionFor } from "../../core/captions.mjs";

const MAX_B64 = 1_600_000; /* about 1.2 MB per image; the app sends 768 px JPEGs of about 100 KB */
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export function clientsFrom(env) {
  try { return JSON.parse(env.CLIENTS || "[]"); } catch { return []; }
}

export async function auth(req, env) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+([\w-]{20,})$/);
  if (!m) return null;
  const h = await sha256hex(m[1]);
  return clientsFrom(env).find((c) => c.app && c.app.token_sha256 === h) || null;
}

const today = () => new Date().toISOString().slice(0, 10);

async function usage(env, id) {
  if (!env.USAGE) return 0;
  return Number(await env.USAGE.get(`u:${id}:${today()}`)) || 0;
}

async function count(env, id, used) {
  if (env.USAGE) await env.USAGE.put(`u:${id}:${today()}`, String(used + 1), { expirationTtl: 172800 });
}

export default {
  async fetch(req, env, ctx, fetchImpl = globalThis.fetch) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
    }
    const client = await auth(req, env);
    if (!client) return json({ error: "unauthorized" }, 401);
    const limit = (client.app && client.app.daily_limit) || 40;
    const until = client.app && client.app.captions_until;
    const used = await usage(env, client.id);

    if (url.pathname === "/api/me" && req.method === "GET") {
      return json({ name: client.name, niche: client.niche, ui_language: (client.app && client.app.ui_language) || client.owner_language || "ru", used, daily_limit: limit, ...(until ? { captions_until: until } : {}) });
    }

    if (url.pathname === "/api/caption" && req.method === "POST") {
      if (until && today() > until) return json({ error: "term_over", captions_until: until }, 402);
      if (used >= limit) return json({ error: "daily_limit" }, 429);
      let body;
      try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
      const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3);
      if (!images.length) return json({ error: "no image" }, 400);
      for (const im of images) {
        if (!im || !TYPES.has(im.media_type) || typeof im.data !== "string" || im.data.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(im.data)) return json({ error: "bad image" }, 400);
      }
      const note = String(body.note || "").slice(0, 300);
      const llm = makeLLM(env, fetchImpl);
      let cap;
      try {
        cap = await captionFor(llm, client, { note }, images);
      } catch (e) {
        console.log("caption failed", client.id, String(e.message).slice(0, 120)); /* no photo data in logs */
        return json({ error: "model" }, 502);
      }
      await count(env, client.id, used);
      return json(cap);
    }
    return json({ error: "not found" }, 404);
  },
};
