/* Checks on a generated caption before it goes to the owner. Pure functions.
   Main idea: every price and every clock time in the caption must come from the owner (note, free times, facts). */
import { BANNED } from "./niches.mjs";

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ");

/* prices like "19 €", "€19", "19,90 EUR", "6 euro" -> numbers as strings "19", "19.90", "6" */
export function prices(text) {
  const out = [];
  const re = /(?:€\s?(\d+(?:[.,]\d{1,2})?))|(\d+(?:[.,]\d{1,2})?)\s?(?:€|eur\b|euro|евро|євро)/gi;
  let m;
  while ((m = re.exec(text))) out.push((m[1] || m[2]).replace(",", "."));
  return out.map((p) => String(Number(p)));
}

/* clock times like 16:00, 16.00, 16 Uhr, 4 pm, в 16 -> minutes after midnight */
export function times(text) {
  const out = [];
  const t = String(text);
  let m;
  const hhmm = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;
  while ((m = hhmm.exec(t))) out.push(Number(m[1]) * 60 + Number(m[2]));
  const uhr = /\b([01]?\d|2[0-3])\s?uhr\b/gi;
  while ((m = uhr.exec(t))) out.push(Number(m[1]) * 60);
  const ampm = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s?(am|pm)\b/gi;
  while ((m = ampm.exec(t))) out.push(((Number(m[1]) % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(m[2] || 0));
  return out;
}

/* returns a list of problems (empty = ok) */
export function checkCaption(cap, { niche, allowedText = "", maxHashtags = 5, maxLen = 2200 }) {
  const problems = [];
  if (!cap || typeof cap.caption !== "string" || !cap.caption.trim()) return ["empty caption"];
  const text = cap.caption;
  const okPrices = new Set(prices(allowedText));
  for (const p of prices(text)) if (!okPrices.has(p)) problems.push(`price ${p} not given by the owner`);
  const okTimes = new Set(times(allowedText));
  for (const t of times(text)) if (!okTimes.has(t)) problems.push(`time ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")} not given by the owner`);
  const low = norm(text);
  for (const w of [...BANNED.all, ...(BANNED[niche] || [])]) if (low.includes(w)) problems.push(`banned phrase "${w}"`);
  const tags = (cap.hashtags || []).length + (text.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  if (tags > maxHashtags) problems.push(`${tags} hashtags, Instagram allows ${maxHashtags}`);
  if (text.length > maxLen) problems.push(`caption longer than ${maxLen} characters`);
  if (/[\u2013\u2014]/.test(text)) problems.push("long dash in text");
  if (cap.status_text && cap.status_text.length > 139) problems.push("status text longer than 139 characters");
  return problems;
}

/* tidy model output: strip long dashes, dedupe hashtags, cap count */
export function tidy(cap, maxHashtags = 5) {
  const fix = (s) => String(s || "").replace(/\s?[\u2013\u2014]\s?/g, ", ").replace(/ ,/g, ",").trim();
  const tags = [...new Set((cap.hashtags || []).map((h) => "#" + String(h).replace(/^#+/, "").replace(/\s+/g, "")))].filter((h) => h.length > 1);
  return {
    caption: fix(cap.caption),
    status_text: fix(cap.status_text || "").slice(0, 139),
    alt: fix(cap.alt || ""),
    hashtags: tags.slice(0, maxHashtags),
  };
}
