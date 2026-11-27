/* Builds the two things to paste into a Gemini Gem (or its successor, a Gemini "Skill") or a NotebookLM notebook:
   1) instructions.txt  2) rules-<id>.md (upload as the knowledge file / source).
   Usage: node gem/build-gem.mjs kb/cleaning-blitz.json out/   (no network) */
import fs from "node:fs";
import path from "node:path";

const LANG = { ru: "Russian", uk: "Ukrainian", de: "German", en: "English" };

export function instructions(kb) {
  const owner = kb.owner_label.en;
  return `You are the helper for the staff of ${kb.name}.
Answer ONLY from the attached file "rules-${kb.id}.md". Do not use the internet or general knowledge.
Answer in the language of the question (${kb.languages.map((l) => LANG[l]).join(", ")}). 1 to 3 short sentences.
After each answer name the section, like: (Rules: ${kb.sections[0].title}).
If the file does not answer the question, say: "This is not in the rules, please ask ${owner}." Do not guess.
Never give tax, legal or medical advice. Never promise customers discounts or money.
If someone types a customer's name, address or phone number, remind them not to and answer without it.`;
}

export function rulesMarkdown(kb) {
  const out = [`# ${kb.name}: rules for the team`, ""];
  for (const s of kb.sections) out.push(`## ${s.title}${s.page ? ` (${s.source}, page ${s.page})` : ` (${s.source})`}`, s.text, "");
  return out.join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("build-gem.mjs")) {
  const [file, dir = "out"] = process.argv.slice(2);
  if (!file) { console.error("usage: node gem/build-gem.mjs kb/<file>.json [outdir]"); process.exit(1); }
  const kb = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "instructions.txt"), instructions(kb));
  fs.writeFileSync(path.join(dir, `rules-${kb.id}.md`), rulesMarkdown(kb));
  console.log(`wrote ${dir}/instructions.txt and ${dir}/rules-${kb.id}.md`);
}
