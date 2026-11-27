/* Caption generator: one call per post. The model writes only from the owner's facts and note.
   Output JSON: { caption, status_text, alt, hashtags }. Checked by guard.mjs, one retry with the problems listed. */
import { NICHES, LANG_NAMES, CTA } from "./niches.mjs";
import { parseJSON } from "./llm.mjs";
import { checkCaption, tidy } from "./guard.mjs";

export function factsText(client) {
  const f = client.facts || {};
  const lines = [];
  if (f.hours) lines.push(`Opening hours: ${f.hours}`);
  if (f.address_hint) lines.push(`Where: ${f.address_hint}`);
  for (const [k, v] of Object.entries(f.prices || {})) lines.push(`Price: ${k} ${v}`);
  for (const x of f.other || []) lines.push(x);
  return lines.join("\n");
}

export function ctaLine(client, lang) {
  const kind = (client.contact && client.contact.cta) || "whatsapp";
  const tpl = (CTA[kind] || CTA.whatsapp)[lang] || CTA.whatsapp.en;
  return tpl.replace("{wa}", (client.contact && client.contact.whatsapp_link) || "").replace("{hours}", (client.facts && client.facts.hours) || "").trim();
}

export function systemPrompt(client) {
  const niche = NICHES[client.niche];
  const lang = client.post_language || "de";
  const second = client.second_language && client.second_language !== lang ? client.second_language : null;
  return [
    `You write social media posts for a ${niche.label} called "${client.name}" in ${client.city || "a German town"}.`,
    `Write the caption in ${LANG_NAMES[lang]}${second ? `, then an empty line and the same caption in ${LANG_NAMES[second]}` : ""}.`,
    `Voice: ${client.voice || "warm, short, plain words, like the owner talking"}. Emoji: ${client.emoji || "at most two"}.`,
    "Length: 2 to 4 short sentences, then the call to action line exactly as given.",
    "Hard rules:",
    "- Use only facts from FACTS, OWNER NOTE, FREE SLOT and what is clearly visible in the photo. Never invent prices, times, dishes, names, results or offers.",
    "- If something is unclear, leave it out. A short true post is better than a long one.",
    "- Do not describe the photo as better than it is. Do not mention editing or filters.",
    "- No long dashes. No hashtags inside the caption text.",
    ...niche.rules.map((r) => "- " + r),
    `Hashtags: up to ${client.max_hashtags || 5}, local and specific (${niche.hashtags_hint}). Use these if they fit: ${(client.hashtags || []).join(" ") || "none given"}.`,
    "status_text: one line under 120 characters for a WhatsApp status, same language as the caption.",
    "alt: a plain description of the photo for blind users, in the caption language, under 120 characters.",
    'Answer with one JSON object only: {"caption": "...", "status_text": "...", "alt": "...", "hashtags": ["#..."]}',
  ].join("\n");
}

export function userContent(client, slot, image) {
  const lang = client.post_language || "de";
  const themeHint = (NICHES[client.niche].themes.find((t) => t[0] === slot.theme) || [null, ""])[1];
  const text = [
    `POST DATE: ${slot.date} (${slot.weekday})`,
    `THEME: ${themeHint}`,
    `OWNER NOTE: ${slot.note || "(none)"}`,
    `FREE SLOT: ${slot.free || "(none)"}`,
    slot.special ? `SPECIAL THIS WEEK: ${slot.special}` : null,
    `FACTS:\n${factsText(client) || "(none)"}`,
    `CALL TO ACTION: ${ctaLine(client, lang)}`,
  ].filter(Boolean).join("\n");
  const blocks = [];
  if (image) blocks.push({ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } });
  blocks.push({ type: "text", text });
  return blocks;
}

/* text the owner gave us: only numbers in here may show up in the caption */
export function allowedText(client, slot) {
  return [factsText(client), slot.note, slot.free, slot.special, ctaLine(client, client.post_language || "de")].filter(Boolean).join("\n");
}

/* returns { caption, status_text, alt, hashtags, problems } ; problems non-empty means "Mikhail must look" */
export async function writeCaption(llm, client, slot, image = null) {
  const system = systemPrompt(client);
  const content = userContent(client, slot, llm.vision ? image : null);
  const opts = { niche: client.niche, allowedText: allowedText(client, slot), maxHashtags: client.max_hashtags || 5 };
  let cap = null;
  let problems = ["no answer"];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? [] : [{ type: "text", text: `Your last answer had these problems, fix them: ${problems.join("; ")}` }];
    const raw = await llm.complete({ system, content: [...content, ...extra] });
    const parsed = parseJSON(raw);
    if (!parsed) { problems = ["answer was not JSON"]; continue; }
    cap = tidy(parsed, opts.maxHashtags);
    problems = checkCaption(cap, opts);
    if (!problems.length) break;
  }
  return { ...(cap || { caption: "", status_text: "", alt: "", hashtags: [] }), problems };
}
