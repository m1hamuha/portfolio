/* Caption for one finished photo or clip. Same honesty rules and checks as the social kit
   (../../social/src): only the owner's facts and what is visible, prices and times checked, one retry. */
import { NICHES, LANG_NAMES } from "../../social/src/niches.mjs";
import { parseJSON } from "../../social/src/llm.mjs";
import { checkCaption, tidy } from "../../social/src/guard.mjs";

export function factsText(client) {
  const f = client.facts || {};
  const lines = [];
  if (f.hours) lines.push(`Opening hours: ${f.hours}`);
  for (const [k, v] of Object.entries(f.prices || {})) lines.push(`Price: ${k} ${v}`);
  for (const x of f.other || []) lines.push(x);
  return lines.join("\n");
}

export function contentSystemPrompt(client) {
  const n = NICHES[client.niche] || NICHES.other;
  const lang = client.post_language || "de";
  const second = client.second_language && client.second_language !== lang ? client.second_language : null;
  return [
    `You write a short caption for one photo or short video of a ${n.label} called "${client.name}"${client.city ? ` in ${client.city}` : ""}.`,
    `Language: ${LANG_NAMES[lang]}${second ? `, then an empty line and the same caption in ${LANG_NAMES[second]}` : ""}.`,
    `Voice: ${client.voice || "warm, plain words, like the owner talking"}. Emoji: ${client.emoji || "at most one"}.`,
    "Length: 1 to 3 short sentences. Start with what is in the picture, in plain words (for example the colour and style of the nails, the dish, the product).",
    "Hard rules:",
    "- Use only NOTE, FACTS and what is clearly visible. Never invent prices, times, names, ingredients, results or offers.",
    "- Do not say the photo was edited. Do not praise the picture, describe the thing.",
    "- No long dashes. No hashtags inside the caption.",
    ...n.rules.map((r) => "- " + r),
    `hashtags: up to ${client.max_hashtags || 4}, local and specific. Prefer: ${(client.hashtags || []).join(" ") || "none given"}.`,
    "status_text: one line under 120 characters for a WhatsApp status or story.",
    "alt: plain description for blind users, under 120 characters, caption language.",
    'Answer with one JSON object only: {"caption": "...", "status_text": "...", "alt": "...", "hashtags": ["#..."]}',
  ].join("\n");
}

/* image: one {media_type, data} or a list (the phone app sends up to 3 photos of one set, one caption for all) */
export function contentUser(client, item, image) {
  const blocks = [];
  for (const im of [].concat(image || []).slice(0, 3)) blocks.push({ type: "image", source: { type: "base64", media_type: im.media_type, data: im.data } });
  blocks.push({
    type: "text",
    text: [`KIND: ${item.video ? "short video (you see one frame)" : [].concat(image || []).length > 1 ? "a set of photos for one post" : "photo"}`, `NOTE: ${item.note || "(none)"}`, `FACTS:\n${factsText(client) || "(none)"}`].join("\n"),
  });
  return blocks;
}

export async function captionFor(llm, client, item, image = null) {
  const system = contentSystemPrompt(client);
  const content = contentUser(client, item, llm.vision ? image : null);
  const opts = { niche: client.niche, allowedText: [factsText(client), item.note].filter(Boolean).join("\n"), maxHashtags: client.max_hashtags || 4 };
  let cap = null, problems = ["no answer"];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt ? [{ type: "text", text: `Fix these problems: ${problems.join("; ")}` }] : [];
    const parsed = parseJSON(await llm.complete({ system, content: [...content, ...extra], maxTokens: 2000 }));
    if (!parsed) { problems = ["answer was not JSON"]; continue; }
    cap = tidy(parsed, opts.maxHashtags);
    problems = checkCaption(cap, opts);
    if (!problems.length) break;
  }
  return { ...(cap || { caption: "", status_text: "", alt: "", hashtags: [] }), problems };
}
