/* Tiny key-value store: Cloudflare KV in production, a Map in tests.
   Stores only what a chat needs for one day: last messages, offered times, pause flag. */

export function kvStore(kv) {
  return {
    async get(k) { const v = await kv.get(k); return v ? JSON.parse(v) : null; },
    async put(k, v, ttl = 86400) { await kv.put(k, JSON.stringify(v), { expirationTtl: Math.max(60, ttl) }); },
    async del(k) { await kv.delete(k); },
  };
}

export function memoryStore() {
  const m = new Map();
  return {
    map: m,
    async get(k) { const e = m.get(k); if (!e) return null; if (e.exp < Date.now()) { m.delete(k); return null; } return e.v; },
    async put(k, v, ttl = 86400) { m.set(k, { v, exp: Date.now() + ttl * 1000 }); },
    async del(k) { m.delete(k); },
  };
}

let fallback = null;
export function storeFor(env) {
  if (env.CHATS) return kvStore(env.CHATS);
  fallback = fallback || memoryStore(); /* per-isolate only: fine for a demo, not for production */
  return fallback;
}
