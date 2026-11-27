#!/usr/bin/env node
/* One review request per customer, by WhatsApp, sent by the business from its own phone.
   node ask/batch.mjs <business.json> <customers.csv> [--out ask.html] [--sent sent.json] [--since 2026-11-01]
   customers.csv columns: name, phone, lang, consent, visit   (consent = yes / ja / да / так)
   Output: one HTML page with a button per customer. Tap -> WhatsApp opens with the ready text -> tap Send.
   Rules built in:
   - everyone with consent gets the same text, nobody is filtered by how happy they seemed (no review gating);
   - only rows with consent (UWG §7: a review request is advertising, BGH VI ZR 225/17);
   - each phone number is asked once (sent.json remembers numbers, mark them with --mark).
   No API, no cost. For sending from a WhatsApp Business API number, use ../../mail (template "review_request"). */
import fs from "node:fs";
import { askText, lintAsk, phoneDigits, escapeHtml } from "../lib/core.mjs";

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === "," || ch === ";") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

const YES = /^(y|yes|ja|j|да|так|1|true|x)$/i;

export function plan(biz, customers, { sent = [], since } = {}) {
  const done = new Set(sent);
  const out = { send: [], skipped: [] };
  for (const c of customers) {
    const digits = phoneDigits(c.phone, biz.country_code);
    if (!digits || digits.length < 8) { out.skipped.push({ ...c, why: "no phone" }); continue; }
    if (!YES.test(c.consent || "")) { out.skipped.push({ ...c, why: "no consent" }); continue; }
    if (done.has(digits)) { out.skipped.push({ ...c, why: "already asked" }); continue; }
    if (since && c.visit && c.visit < since) { out.skipped.push({ ...c, why: "visit before " + since }); continue; }
    const lang = ["de", "en", "ru", "uk"].includes(c.lang) ? c.lang : biz.lang || "de";
    const first = (c.name || "").split(/\s+/)[0];
    const text = askText(biz, { lang, name: first });
    const problems = lintAsk(text);
    if (problems.length) throw new Error("text breaks the rules: " + problems.map((p) => p.why).join("; "));
    done.add(digits);
    out.send.push({ name: c.name, digits, lang, text, link: `https://wa.me/${digits}?text=${encodeURIComponent(text)}` });
  }
  return out;
}

export function pageHtml(biz, p) {
  const items = p.send.map((s) => `<li><a class="b" href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.name || s.digits)} (${s.lang})</a><details><summary>Text</summary><pre>${escapeHtml(s.text)}</pre></details></li>`).join("");
  const skipped = p.skipped.map((s) => `<li>${escapeHtml(s.name || "?")}: ${escapeHtml(s.why)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(biz.name)}: review requests</title>` +
    `<style>body{font:16px/1.4 system-ui,sans-serif;margin:16px;max-width:640px}li{margin:10px 0}.b{display:inline-block;padding:10px 14px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}pre{white-space:pre-wrap;background:#f4f4f4;padding:8px}</style></head><body>` +
    `<h1>${escapeHtml(biz.name)}</h1><p>${p.send.length} to send. Tap a name, WhatsApp opens with the text, tap Send.</p><ol>${items}</ol>` +
    (skipped ? `<h2>Not sent</h2><ul>${skipped}</ul>` : "") + `</body></html>`;
}

function arg(n) { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const [bizPath, csvPath] = process.argv.slice(2);
  if (!bizPath || !csvPath) { console.error("usage: batch.mjs <business.json> <customers.csv> [--out ask.html] [--sent sent.json] [--since YYYY-MM-DD] [--mark]"); process.exit(2); }
  const biz = JSON.parse(fs.readFileSync(bizPath, "utf8"));
  const sentPath = arg("--sent");
  const sent = sentPath && fs.existsSync(sentPath) ? JSON.parse(fs.readFileSync(sentPath, "utf8")) : [];
  const p = plan(biz, parseCsv(fs.readFileSync(csvPath, "utf8")), { sent, since: arg("--since") });
  const out = arg("--out") || "ask.html";
  fs.writeFileSync(out, pageHtml(biz, p));
  if (sentPath && process.argv.includes("--mark")) fs.writeFileSync(sentPath, JSON.stringify([...sent, ...p.send.map((s) => s.digits)], null, 1));
  console.log(`wrote ${out}: ${p.send.length} to send, ${p.skipped.length} skipped`);
}
