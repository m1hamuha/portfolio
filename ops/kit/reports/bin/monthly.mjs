#!/usr/bin/env node
/* One-page month from a bank CSV, offline. Same logic as the Apps Script (lib/ReportsCore.gs).
   node bin/monthly.mjs examples/other-kiosk.json examples/bank.sample.csv 2026-11 [--table]
   Prints the text to paste into WhatsApp; --table also prints every payment with its category, "?" = guessed. */
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const [cfgFile, csvFile, month, flag] = process.argv.slice(2);
if (!cfgFile || !csvFile || !/^\d{4}-\d{2}$/.test(month || "")) {
  console.error("usage: monthly.mjs <client.json> <bank.csv> <YYYY-MM> [--table]"); process.exit(1);
}
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(fileURLToPath(new URL("../lib/ReportsCore.gs", import.meta.url)), "utf8"), ctx);
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
const rows = ctx.csvToObjects(fs.readFileSync(csvFile, cfg.bank_csv.encoding === "latin1" ? "latin1" : "utf8"), cfg.bank_csv.map, cfg.bank_csv.delimiter);
const txc = ctx.categorize(rows, cfg.rules);
const sm = ctx.monthSummary(txc, month);
console.log(ctx.onePageText(sm, cfg.lang, cfg.cat_names, cfg.business.name));
if (flag === "--table") {
  console.log("\n---");
  for (const t of txc.filter((t) => t.date.startsWith(month))) console.log([t.date, t.amount, (t.guessed ? "? " : "") + t.cat, t.payee, t.purpose].join(" | "));
}
if (sm.unsorted) console.error(`\n${sm.unsorted} payments guessed: check them or add words to rules`);
