/* Loads HiringCore.gs and QrSvg.gs (plain Apps Script files) into node. */
import vm from "node:vm";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const read = (p) => fs.readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const ctx = vm.createContext({});
vm.runInContext(read("./HiringCore.gs"), ctx, { filename: "HiringCore.gs" });
vm.runInContext(read("../vendor/qrcode.js") + "\n" + read("./QrSvg.gs"), ctx, { filename: "qr" });
export const core = ctx;
export const PROMPT = read("../prompts/job-ad.md");
