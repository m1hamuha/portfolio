/* Cloudflare Worker for the staff helper.
   GET  /            the phone page (public/index.html, served as static assets)
   POST /ask         { code, q } -> { found, answer, sources }
   GET  /unanswered  ?code=OWNER_CODE -> questions the rules could not answer (to add to the rule book)
   Secrets: ANTHROPIC_API_KEY, TEAM_CODE (staff), OWNER_CODE (owner). Vars: KB_ID. */
import { ask } from "./kb.js";
import { makeLLM } from "../../../bot/engine/src/llm.js";
import { storeFor } from "../../../bot/engine/src/store.js";
import office from "../../kb/office-steuer.json" with { type: "json" };
import cleaning from "../../kb/cleaning-blitz.json" with { type: "json" };

const KBS = { [office.id]: office, [cleaning.id]: cleaning };
const hits = new Map();

function same(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function handleAsk(req, env, fetchImpl = fetch) {
  const kb = KBS[env.KB_ID];
  if (!kb) return json({ error: "KB_ID not set" }, 500);
  let body; try { body = await req.json(); } catch { return json({ error: "json" }, 400); }
  if (!same(body.code, env.TEAM_CODE)) return json({ error: "code" }, 401);
  const ip = req.headers.get("CF-Connecting-IP") || "x"; const now = Date.now();
  const l = (hits.get(ip) || []).filter((t) => now - t < 60000); l.push(now); hits.set(ip, l);
  if (l.length > 15) return json({ error: "slow down" }, 429);
  const store = storeFor(env);
  const r = await ask(kb, body.q, {
    llm: makeLLM(env, fetchImpl),
    log: async (q) => { await store.put(`q:${kb.id}:${now}`, { q, at: new Date(now).toISOString() }, 30 * 86400); const idx = (await store.get(`qi:${kb.id}`)) || []; idx.push(now); await store.put(`qi:${kb.id}`, idx.slice(-200), 30 * 86400); },
  });
  return json(r);
}

export async function handleUnanswered(url, env) {
  const kb = KBS[env.KB_ID];
  if (!kb || !same(url.searchParams.get("code"), env.OWNER_CODE)) return json({ error: "code" }, 401);
  const store = storeFor(env);
  const idx = (await store.get(`qi:${kb.id}`)) || [];
  const list = [];
  for (const t of idx) { const q = await store.get(`q:${kb.id}:${t}`); if (q) list.push(q); }
  return json({ questions: list });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/ask" && req.method === "POST") return handleAsk(req, env);
    if (url.pathname === "/unanswered") return handleUnanswered(url, env);
    if (env.ASSETS) return env.ASSETS.fetch(req); /* serves public/ask.html as / */
    return new Response("not found", { status: 404 });
  },
};
