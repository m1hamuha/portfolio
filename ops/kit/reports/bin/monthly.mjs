#!/usr/bin/env node
/* One-page month from a bank CSV, offline. Same logic as the Apps Script (lib/ReportsCore.gs).
   node bin/monthly.mjs examples/other-kiosk.json examples/bank.sample.csv [second-bank.csv ...] 2026-11 [--table]
   Prints the text to paste into WhatsApp; --table also prints every payment with its category, "?" = guessed. */
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const args = process.argv.slice(2);
const flag = args.includes("--table") ? "--table" : "";
const pos = args.filter((a) => a !== "--table");
const month = pos.find((a) => /^\d{4}-\d{2}$/.test(a));
const [cfgFile, ...csvFiles] = pos.filter((a) => a !== month);
if (!cfgFile || !csvFiles.length || !month) {
  console.error("usage: monthly.mjs <client.json> <bank.csv> [second-bank.csv ...] <YYYY-MM> [--table]"); process.exit(1);
}
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(fileURLToPath(new URL("../lib/ReportsCore.gs", import.meta.url)), "utf8"), ctx);
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
const enc = (e) => (/^(latin1|iso-8859-1|windows-1252)$/i.test(e || "") ? "latin1" : "utf8");
const seen = new Set();
const rows = [];
for (const f of csvFiles) {
  const buf = fs.readFileSync(f);
  for (const r of ctx.bankCsvRows((e) => buf.toString(enc(e)), ctx.bankProfiles(cfg)).rows) {
    const k = [ctx.isoDate(r.date), ctx.num(r.amount).toFixed(2), String(r.payee || "").trim(), String(r.purpose || "").trim()].join("|");
    if (!seen.has(k)) { seen.add(k); rows.push(r); } // overlapping exports are not counted twice
  }
}
const txc = ctx.categorize(rows, cfg.rules);
const sm = ctx.monthSummary(txc, month);
console.log(ctx.onePageText(sm, cfg.lang, cfg.cat_names, cfg.business.name));
if (flag === "--table") {
  console.log("\n---");
  for (const t of txc.filter((t) => t.date.startsWith(month))) console.log([t.date, t.amount, (t.guessed ? "? " : "") + t.cat, t.payee, t.purpose].join(" | "));
}
if (sm.unsorted) console.error(`\n${sm.unsorted} payments guessed: check them or add words to rules`);
