#!/usr/bin/env node
/* node bin/config-gs.mjs examples/cafe-olive.json > Config.gs   (paste Config.gs into the client's Apps Script) */
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const file = process.argv[2];
if (!file) { console.error("usage: config-gs.mjs <client.json>"); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(fileURLToPath(new URL("../lib/ReportsCore.gs", import.meta.url)), "utf8"), ctx);
const errs = ctx.validateReportConfig(cfg);
if (errs.length) { console.error("config errors:\n- " + errs.join("\n- ")); process.exit(2); }
process.stdout.write("/* generated from " + file.split("/").pop() + " */\nvar CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n");
