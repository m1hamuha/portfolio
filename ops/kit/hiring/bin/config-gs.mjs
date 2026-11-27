#!/usr/bin/env node
/* node bin/config-gs.mjs examples/cafe-olive.json > Config.gs   (paste into the client's Apps Script project) */
import fs from "node:fs";
import { core } from "../lib/core.mjs";
const file = process.argv[2];
if (!file) { console.error("usage: config-gs.mjs <client.json>"); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
const errs = core.validateHiringConfig(cfg);
if (errs.length) { console.error("config errors:\n- " + errs.join("\n- ")); process.exit(2); }
process.stdout.write("/* generated from " + file.split("/").pop() + " */\nvar CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n");
