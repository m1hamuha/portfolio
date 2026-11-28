#!/usr/bin/env node
/* Reply drafts for Google reviews.
   node replies/draft.mjs <business.json> <reviews.json> [--out drafts.md]
   node replies/draft.mjs <business.json> --image screenshot.jpg [--note "what happened"] [--out drafts.md] [--force]
     --image works only while "screenshots_until" (YYYY-MM-DD) in business.json is not past: cafe gets 30 days of screenshots.
   reviews.json: [{ "author": "Anna", "rating": 2, "text": "...", "owner_note": "cook was ill, now two cooks" }]
   Needs ANTHROPIC_API_KEY in the environment (or LLM_PROVIDER=mock for a dry run). Nothing is posted anywhere:
   you read the drafts, send bad-review drafts to the owner, then paste them on Google yourself. */
import fs from "node:fs";
import path from "node:path";
import { buildReplyPrompt, parseModelJson, checkReply, waLink } from "../lib/core.mjs";
import { makeLLM } from "../lib/llm.mjs";

const MEDIA = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

/* cafe and similar: screenshot drafts are part of the one-time price only for a set window (30 days from the order).
   business.json: "screenshots_until": "YYYY-MM-DD" (last day included). No field: no window, not a screenshot client. */
export function screenshotWindow(biz, now = new Date()) {
  const until = biz.screenshots_until;
  if (!until) return { open: false, until: null, reason: "no screenshots_until in business.json" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { open: false, until, reason: "screenshots_until must be YYYY-MM-DD" };
  const end = new Date(until + "T23:59:59Z");
  return end >= now ? { open: true, until } : { open: false, until, reason: `screenshot window ended on ${until}` };
}

export function untilFromStart(start, days = 30) {
  const d = new Date(start + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days - 1);
  return d.toISOString().slice(0, 10);
}

export async function draftOne(biz, review, llm, image) {
  const p = buildReplyPrompt(biz, image ? { ...review, text: review.text || "(the review is in the attached screenshot: read the author, the stars and the text from it)" } : review);
  let system = p.system;
  if (image) system += '\nThe review is in the screenshot. Also add "rating": number (1 to 5) and "author": string to the JSON.';
  const content = image
    ? [{ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } }, { type: "text", text: p.user }]
    : p.user;
  const raw = await llm.complete({ system, content, maxTokens: 2000 });
  const parsed = parseModelJson(raw) || { reply: "", flags: ["model output was not JSON"] };
  const rv = { ...review, rating: review.rating || parsed.rating, author: review.author || parsed.author };
  const checked = checkReply(biz, rv, parsed);
  const forOwner = checked.needs_owner_ok && biz.owner_whatsapp
    ? waLink(biz.owner_whatsapp, `${rv.author || ""} (${rv.rating || "?"}/5): ${String(rv.text || "").slice(0, 300)}\n\nDraft reply:\n${checked.reply}\n\nOK?`, biz.country_code)
    : null;
  return { review: rv, ...checked, owner_link: forOwner };
}

export async function draftReplies(biz, reviews, llm) {
  const out = [];
  for (const r of reviews) out.push(await draftOne(biz, r, llm));
  return out;
}

export function toMarkdown(biz, drafts) {
  const lines = [`# Reply drafts: ${biz.name}`, ""];
  drafts.forEach((d, i) => {
    lines.push(`## ${i + 1}. ${d.review.author || "?"}, ${d.review.rating || "?"} of 5`);
    if (d.review.text) lines.push("", `> ${String(d.review.text).replace(/\n/g, "\n> ")}`);
    lines.push("", d.reply || "(no draft)", "");
    lines.push(`- owner OK needed: ${d.needs_owner_ok ? "YES" : "no"}`);
    if (d.problems.length) lines.push(`- CHECK: ${d.problems.join("; ")}`);
    if (d.flags.length) lines.push(`- flags: ${d.flags.join("; ")}`);
    if (d.owner_link) lines.push(`- send to owner: ${d.owner_link}`);
    lines.push("");
  });
  return lines.join("\n");
}

function arg(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const [bizPath, reviewsPath] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(all[i - 1] || "").startsWith("--"));
  if (!bizPath) { console.error("usage: draft.mjs <business.json> <reviews.json> | --image file [--note text] [--out file]"); process.exit(2); }
  const biz = JSON.parse(fs.readFileSync(bizPath, "utf8"));
  const llm = makeLLM(process.env);
  let drafts;
  const img = arg("--image");
  if (img) {
    const w = screenshotWindow(biz);
    if (!w.open && !process.argv.includes("--force")) {
      console.error(`not drafting: ${w.reason}. New reviews after the window come by the watcher (owner_drafts). --force to draft anyway.`);
      process.exit(3);
    }
    const data = fs.readFileSync(img).toString("base64");
    drafts = [await draftOne(biz, { owner_note: arg("--note") || "" }, llm, { media_type: MEDIA[path.extname(img).toLowerCase()] || "image/jpeg", data })];
  } else {
    drafts = await draftReplies(biz, JSON.parse(fs.readFileSync(reviewsPath, "utf8")), llm);
  }
  const md = toMarkdown(biz, drafts);
  const out = arg("--out");
  if (out) { fs.writeFileSync(out, md); console.log(`wrote ${out} (${drafts.length} drafts, model ${llm.name})`); } else console.log(md);
}
