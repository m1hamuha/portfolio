#!/usr/bin/env node
/* Job ad + form preview for one client, from examples/<client>.json.
   node bin/job-ad.mjs examples/cafe-olive.json --link https://forms.gle/xxx --out /tmp/ad   (needs ANTHROPIC_API_KEY)
   node bin/job-ad.mjs examples/cafe-olive.json --dry       (prints the prompt, no API call)
   Writes <out>.md (ads in every language, AGG check, form questions, where to post) and <out>-qr.svg (QR for the form). */
import fs from "node:fs";
import { core, PROMPT } from "../lib/core.mjs";
import { makeLLM } from "../lib/llm.mjs";

const WHERE = {
  de: [
    "Jobbörse der Bundesagentur für Arbeit (kostenlos, Arbeitgeberkonto auf arbeitsagentur.de)",
    "Indeed (bis zu 3 kostenlose Anzeigen pro Monat, je bis 30 Tage; Sponsored Jobs kosten extra)",
    "Kleinanzeigen Jobs (für Gewerbe 1 kostenlose Jobanzeige pro 30 Tage laut Vergleichsportalen, prüfen)",
    "Aushang im Laden / Fenster mit QR-Code, eigene Instagram-Story, Google-Unternehmensprofil Beitrag"
  ]
};

export async function makeAd(cfg, { llm, link = "{{FORM_LINK}}" } = {}) {
  const req = core.buildAdRequest(cfg);
  const system = PROMPT.replace("{{MAX_WORDS}}", String(req.max_words));
  const raw = await llm.complete({ system, user: req.user });
  const j = core.parseAdJson(raw);
  const ads = {};
  const issues = {};
  for (const l of req.langs) {
    if (!j.ads[l]) throw new Error(`model skipped language ${l}`);
    ads[l] = j.ads[l].split("{{FORM_LINK}}").join(link);
    issues[l] = [...core.aggLint(ads[l], l)];
  }
  if (j.title_de) issues.title = [...core.aggLint(j.title_de, "de")];
  return { title_de: j.title_de, ads, issues, system, user: req.user };
}

export function renderMarkdown(cfg, res, spec, qlint) {
  const out = [`# ${res.title_de || cfg.job.title} | ${cfg.business.name}`, ""];
  for (const [l, t] of Object.entries(res.ads)) out.push(`## ${l}`, "", t, "");
  out.push("## AGG check", "");
  const all = Object.entries(res.issues).flatMap(([l, xs]) => xs.map((x) => `- ${l}: ${x.level} ${x.why}${x.match ? ` ("${x.match}")` : ""}`));
  out.push(...(all.length ? all : ["- ok, nothing found (still read it once yourself)"]), "");
  out.push("## Form", "", spec.description, "");
  spec.items.forEach((i, k) => out.push(`${k + 1}. ${i.title}${i.required ? " *" : ""}${i.options ? ` [${i.options.join(" / ")}]` : ""}`));
  if (qlint.length) out.push("", "Form problems:", ...qlint.map((x) => `- ${x.id}: ${x.why}`));
  out.push("", "## Where to post", "", ...(cfg.post_to || WHERE.de).map((w) => `- ${w}`), "");
  return out.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const file = args[0];
  if (!file) { console.error("usage: job-ad.mjs <client.json> [--link URL] [--out PATH] [--dry]"); process.exit(1); }
  const opt = (k) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : null; };
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  const errs = core.validateHiringConfig(cfg);
  if (errs.length) { console.error("config errors:\n- " + errs.join("\n- ")); process.exit(2); }
  const spec = core.buildFormSpec(cfg);
  const qlint = [...core.lintQuestions(spec)];
  if (args.includes("--dry")) {
    const req = core.buildAdRequest(cfg);
    console.log(PROMPT.replace("{{MAX_WORDS}}", String(req.max_words)), "\n---\n", req.user);
    return;
  }
  const link = opt("--link") || "{{FORM_LINK}}";
  const res = await makeAd(cfg, { llm: makeLLM(), link });
  const md = renderMarkdown(cfg, res, spec, qlint);
  const out = opt("--out");
  if (out) {
    fs.writeFileSync(out + ".md", md);
    if (link !== "{{FORM_LINK}}") fs.writeFileSync(out + "-qr.svg", core.qrSvg(link, { px: 600 }));
    console.log(`wrote ${out}.md`);
  } else console.log(md);
  const errors = Object.values(res.issues).flat().filter((x) => x.level === "error");
  if (errors.length) { console.error(`\n${errors.length} AGG problem(s): fix the text before posting`); process.exitCode = 3; }
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
