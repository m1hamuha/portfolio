#!/usr/bin/env node
/* Reply drafts for Google reviews.
   node replies/draft.mjs <business.json> <reviews.json> [--out drafts.md]
   node replies/draft.mjs <business.json> --image screenshot.jpg [--note "what happened"] [--out drafts.md]
   reviews.json: [{ "author": "Anna", "rating": 2, "text": "...", "owner_note": "cook was ill, now two cooks" }]
   Needs ANTHROPIC_API_KEY in the environment (or LLM_PROVIDER=mock for a dry run). Nothing is posted anywhere:
   you read the drafts, send bad-review drafts to the owner, then paste them on Google yourself. */
import fs from "node:fs";
import path from "node:path";
import { buildReplyPrompt, parseModelJson, checkReply, waLink } from "../lib/core.mjs";
import { makeLLM } from "../lib/llm.mjs";

const MEDIA = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function draftOne(biz, review, llm, image) {
  const p = buildReplyPrompt(biz, image ? { ...review, text: review.text || "(the review is in the attached screenshot: read the author, the stars and the text from it)" } : review);
  let system = p.system;
  if (image) system += '\nThe review is in the screenshot. Also add "rating": number (1 to 5) and "author": string to the JSON.';
  const content = image
    ? [{ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } }, { type: "text", text: p.user }]
    : p.user;
  const raw = await llm.complete({ system, content, maxTokens: 800 });
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
    const data = fs.readFileSync(img).toString("base64");
    drafts = [await draftOne(biz, { owner_note: arg("--note") || "" }, llm, { media_type: MEDIA[path.extname(img).toLowerCase()] || "image/jpeg", data })];
  } else {
    drafts = await draftReplies(biz, JSON.parse(fs.readFileSync(reviewsPath, "utf8")), llm);
  }
  const md = toMarkdown(biz, drafts);
  const out = arg("--out");
  if (out) { fs.writeFileSync(out, md); console.log(`wrote ${out} (${drafts.length} drafts, model ${llm.name})`); } else console.log(md);
}
