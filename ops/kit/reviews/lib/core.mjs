/* Loads Core.gs (plain Apps Script file) into node and exports its functions. */
import vm from "node:vm";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const src = fs.readFileSync(fileURLToPath(new URL("./Core.gs", import.meta.url)), "utf8");
const ctx = vm.createContext({});
vm.runInContext(src, ctx, { filename: "Core.gs" });

export const {
  REVIEW_LANGS, reviewUrl, mapsUrl, phoneDigits, waLink, askText, cardTexts, lintAsk,
  buildReplyPrompt, parseModelJson, checkReply, estimateNewStars, escapeHtml, toneFor,
} = ctx;
export const CORE_SOURCE = src;
