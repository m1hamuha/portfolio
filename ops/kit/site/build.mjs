#!/usr/bin/env node
/* One-page site generator.
   node build.mjs <business.json> [--out dist/<id>] [--strict]
   Writes a static folder: index.html (main language), <lang>/index.html for other languages, impressum.html,
   datenschutz.html, img/, robots.txt, sitemap.xml (if base_url), _headers (Cloudflare Pages).
   Photos: paths in business.json are relative to the business.json file. Compress them first (long side 1600 px, under 400 KB).
   Deploy (free): npx wrangler pages deploy dist/<id> --project-name <id>   (see README) */
import fs from "node:fs";
import path from "node:path";
import { validate, renderPage, impressumHtml, datenschutzHtml } from "./lib/render.mjs";

export function build(biz, { outDir, baseDir = ".", strict = false } = {}) {
  const v = validate(biz);
  if (v.errors.length || (strict && v.warnings.length)) {
    const e = new Error("business.json has problems:\n- " + [...v.errors, ...(strict ? v.warnings : [])].join("\n- "));
    e.validation = v;
    throw e;
  }
  const langs = biz.langs || [biz.lang || "de"];
  const main = biz.lang || langs[0];
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  const write = (rel, content) => { const f = path.join(outDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); files.push(rel); };
  for (const lang of langs) write(lang === main ? "index.html" : `${lang}/index.html`, renderPage(biz, lang));
  write("impressum.html", impressumHtml(biz));
  write("datenschutz.html", datenschutzHtml(biz));
  const warnings = [...v.warnings];
  for (const p of biz.photos || []) {
    const src = path.resolve(baseDir, p.file);
    if (!fs.existsSync(src)) { warnings.push(`photo not found: ${p.file}`); continue; }
    const size = fs.statSync(src).size;
    if (size > 500 * 1024) warnings.push(`photo ${p.file} is ${Math.round(size / 1024)} KB, compress it (squoosh.app)`);
    fs.mkdirSync(path.join(outDir, "img"), { recursive: true });
    fs.copyFileSync(src, path.join(outDir, "img", path.basename(p.file)));
    files.push("img/" + path.basename(p.file));
  }
  const base = biz.base_url ? biz.base_url.replace(/\/?$/, "/") : "";
  write("robots.txt", "User-agent: *\nAllow: /\n" + (base ? `Sitemap: ${base}sitemap.xml\n` : ""));
  if (base) write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${langs.map((l) => `<url><loc>${base}${l === main ? "" : l + "/"}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("_headers", "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n/img/*\n  Cache-Control: public, max-age=604800\n");
  return { files, warnings };
}

function arg(n) { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) { console.error("usage: build.mjs <business.json> [--out dir] [--strict]"); process.exit(2); }
  const biz = JSON.parse(fs.readFileSync(file, "utf8"));
  try {
    const r = build(biz, { outDir: arg("--out") || path.join("dist", biz.id), baseDir: path.dirname(file), strict: process.argv.includes("--strict") });
    console.log(`built ${r.files.length} files`);
    for (const w of r.warnings) console.log("WARN", w);
  } catch (e) { console.error(e.message); process.exit(1); }
}
