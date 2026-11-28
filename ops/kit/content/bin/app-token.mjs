#!/usr/bin/env node
/* node bin/app-token.mjs new                 -> a new app token and its sha256 (token goes only into the install link)
   node bin/app-token.mjs until [YYYY-MM-DD] [months] -> the captions_until date (default: today + 12 months)
   node bin/app-token.mjs clients [dir]       -> JSON for the Worker secret CLIENTS from <dir>/*.json with "delivery": "app"
      pipe it: node bin/app-token.mjs clients clients | npx wrangler secret put CLIENTS */
import { randomBytes, createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const newToken = () => randomBytes(24).toString("base64url");
export const hash = (t) => createHash("sha256").update(t).digest("hex");

/* the app writes captions for a term named at sale (default 12 months); photos and clips keep working after it */
export function captionsUntil(from = new Date().toISOString().slice(0, 10), months = 12) {
  const d = new Date(from + "T12:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

/* only what the Worker needs; no phone numbers, no addresses */
export function workerEntry(c) {
  const { id, name, niche, city, owner_language, post_language, second_language, voice, emoji, hashtags, max_hashtags, facts, app } = c;
  if (!app || !/^[0-9a-f]{64}$/.test(app.token_sha256 || "")) throw new Error(`${id}: app.token_sha256 missing`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(app.captions_until || "")) throw new Error(`${id}: app.captions_until missing (YYYY-MM-DD, see "app-token.mjs until")`);
  return { id, name, niche, city, owner_language, post_language, second_language, voice, emoji, hashtags, max_hashtags, facts, app: { token_sha256: app.token_sha256, daily_limit: app.daily_limit || 40, ui_language: app.ui_language, captions_until: app.captions_until } };
}

export async function buildClients(dir, includeExamples = false) {
  const out = [];
  for (const f of (await readdir(dir)).sort()) {
    if (!f.endsWith(".json") || (!includeExamples && f.endsWith(".example.json"))) continue;
    const c = JSON.parse(await readFile(join(dir, f), "utf8"));
    if (c.delivery === "app") out.push(workerEntry(c));
  }
  return out;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const [cmd, dir] = process.argv.slice(2);
  if (cmd === "new") {
    const t = newToken();
    console.log(`token (put only into the install link https://<worker>/#t=TOKEN and as {code} in app_install): ${t}\ntoken_sha256 (put into the client file, app.token_sha256): ${hash(t)}`);
  } else if (cmd === "until") {
    console.log(captionsUntil(dir || undefined, process.argv[4] || 12));
  } else if (cmd === "clients") {
    buildClients(dir || "clients").then((l) => {
      const out = JSON.stringify(l);
      /* Cloudflare: one variable or secret is at most 5 KB (about 10 clients). Above that, move CLIENTS to KV. */
      if (Buffer.byteLength(out) > 5000) { console.error(`CLIENTS is ${Buffer.byteLength(out)} bytes, Cloudflare allows 5 KB per secret. Shorten facts or move the list to KV.`); process.exit(1); }
      process.stdout.write(out);
    }).catch((e) => { console.error(e.message); process.exit(1); });
  } else {
    console.error("usage: app-token.mjs new | until [YYYY-MM-DD] [months] | clients [dir]");
    process.exit(2);
  }
}
