#!/usr/bin/env node
/* Review link + QR + print kit.
   node tool/build.mjs <business.json> [--out dir]   -> qr.svg, print.html (A4: 4 cards A6 + 8 stickers), texts.md
   node tool/build.mjs --app [--out tool/review-kit.html] -> one offline HTML page: type a Place ID or review link, get the same
   Nothing goes over the network. Print print.html from Chrome: A4, margins "none", scale 100 %. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CORE_SOURCE, reviewUrl, askText, cardTexts, lintAsk, escapeHtml, REVIEW_LANGS } from "../lib/core.mjs";
import { QR_SOURCE, qrSvg } from "../lib/qr.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

const PRINT_CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111 }
.sheet { width: 210mm; height: 297mm; display: grid; grid-template: 1fr 1fr / 1fr 1fr; page-break-after: always }
.card { border: 0.2mm dashed #bbb; padding: 10mm 9mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center }
.card h1 { font-size: 17pt; line-height: 1.2; margin: 0 }
.card .biz { font-size: 11pt; letter-spacing: .02em; color: var(--c) ; font-weight: 700; margin-top: 3mm }
.card svg { width: 58mm; height: 58mm }
.card .stars { color: #9aa0a6; font-size: 18pt; letter-spacing: 2mm }
.card .scan { font-size: 10pt; color: #333 }
.card .url { font-size: 7pt; color: #666; word-break: break-all }
.stickers { width: 210mm; height: 297mm; display: grid; grid-template: repeat(4, 1fr) / repeat(2, 1fr); gap: 0 }
.sticker { border: 0.2mm dashed #bbb; display: flex; align-items: center; justify-content: center; gap: 5mm; padding: 6mm }
.sticker svg { width: 40mm; height: 40mm }
.sticker b { font-size: 13pt; max-width: 45mm; text-align: left }
@media screen { body { background: #eee } .sheet, .stickers { background: #fff; margin: 8mm auto; box-shadow: 0 1mm 4mm #0003 } }
`;

export function cardHtml(biz, lang, url, svg) {
  const t = cardTexts(biz, lang);
  return `<div class="card" lang="${lang}"><div><h1>${escapeHtml(t.title)}</h1><div class="biz">${escapeHtml(biz.name)}</div></div>` +
    `<div class="stars">☆☆☆☆☆</div>${svg}<div class="scan">${escapeHtml(t.scan)}</div><div class="url">${escapeHtml(t.or)}: ${escapeHtml(url)}</div></div>`;
}

export function printHtml(biz) {
  const url = reviewUrl(biz);
  const svg = qrSvg(url);
  const langs = (biz.langs && biz.langs.length ? biz.langs : [biz.lang || "de"]).filter((l) => REVIEW_LANGS.includes(l));
  const four = [0, 1, 2, 3].map((i) => langs[i % langs.length]);
  const stickers = Array.from({ length: 8 }, (_, i) => {
    const l = langs[i % langs.length];
    return `<div class="sticker" lang="${l}">${svg}<b>${escapeHtml(cardTexts(biz, l).title)}</b></div>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(biz.name)}: review cards</title>` +
    `<style>${PRINT_CSS}</style></head><body style="--c:${escapeHtml(biz.color || "#1a73e8")}">` +
    `<div class="sheet">${four.map((l) => cardHtml(biz, l, url, svg)).join("")}</div><div class="stickers">${stickers}</div></body></html>`;
}

export function textsMd(biz) {
  const url = reviewUrl(biz);
  const langs = biz.langs && biz.langs.length ? biz.langs : [biz.lang || "de"];
  const out = [`# ${biz.name}: review link and texts`, "", `Review link: ${url}`, "",
    "Rules: send the same text to every customer after the visit, not only to happy ones. No discount, gift or draw for a review. Do not ask for stars or for names of staff.", ""];
  for (const lang of langs) {
    const text = askText(biz, { lang });
    const probs = lintAsk(text);
    out.push(`## ${lang}`, "", "```", text, "```", "",
      `Share on WhatsApp (pick the contact yourself): https://wa.me/?text=${encodeURIComponent(text)}`, "");
    if (probs.length) out.push(`CHECK: ${probs.map((p) => p.why).join("; ")}`, "");
  }
  return out.join("\n");
}

export function buildKit(biz, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const url = reviewUrl(biz);
  fs.writeFileSync(path.join(outDir, "qr.svg"), qrSvg(url, { px: 1000 }));
  fs.writeFileSync(path.join(outDir, "print.html"), printHtml(biz));
  fs.writeFileSync(path.join(outDir, "texts.md"), textsMd(biz));
  return ["qr.svg", "print.html", "texts.md"].map((f) => path.join(outDir, f));
}

/* ---------- offline app ---------- */
export function appHtml() {
  const ui = fs.readFileSync(path.join(here, "app.html"), "utf8");
  const js = CORE_SOURCE + "\n" + QR_SOURCE + "\nvar PRINT_CSS = " + JSON.stringify(PRINT_CSS) + ";\n" + fs.readFileSync(path.join(here, "app.js"), "utf8");
  return ui.replace("/*__SCRIPT__*/", () => js.replace(/<\/script/gi, "<\\/script"));
}

function arg(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; }

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--app")) {
    const out = arg("--out") || path.join(here, "review-kit.html");
    fs.writeFileSync(out, appHtml());
    console.log("wrote", out);
  } else {
    const file = process.argv[2];
    if (!file || file.startsWith("--")) { console.error("usage: build.mjs <business.json> [--out dir] | --app"); process.exit(2); }
    const biz = JSON.parse(fs.readFileSync(file, "utf8"));
    const out = arg("--out") || path.join("out", biz.id || "client");
    console.log(buildKit(biz, out).join("\n"));
  }
}
