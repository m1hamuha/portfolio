/* Run the test questions against the helper.
   Offline (default): prints the questions as a checklist for testing a Gemini Gem / NotebookLM by hand.
   Live: ANTHROPIC_API_KEY=... node eval/run-eval.mjs eval/office-steuer.json --live
   (costs a few cents with claude-haiku-5-5; never run in automated tests). */
import fs from "node:fs";
import { ask } from "../engine/src/kb.js";
import { makeLLM } from "../../bot/engine/src/llm.js";

export function score(results) {
  let pass = 0;
  for (const r of results) {
    const want = r.expect;
    r.pass = want.length === 0 ? !r.found : r.found && want.some((id) => r.ids.includes(id));
    if (r.pass) pass++;
  }
  return { pass, total: results.length };
}

export async function runEval(kb, set, llm) {
  const results = [];
  for (const item of set.questions) {
    const r = await ask(kb, item.q, { llm });
    const ids = kb.sections.filter((s) => r.sources.some((l) => l.endsWith(`: ${s.title}`))).map((s) => s.id);
    results.push({ q: item.q, expect: item.expect, found: r.found, ids, answer: r.answer });
  }
  return { results, ...score(results) };
}

if (process.argv[1] && process.argv[1].endsWith("run-eval.mjs")) {
  if (!process.argv[2]) { console.error("usage: node eval/run-eval.mjs eval/<set>.json [--live]"); process.exit(1); }
  const set = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const kb = JSON.parse(fs.readFileSync(new URL(`../kb/${set.kb}.json`, import.meta.url), "utf8"));
  if (!process.argv.includes("--live")) {
    set.questions.forEach((x, i) => console.log(`${i + 1}. ${x.q}  -> ${x.expect.length ? "rules: " + x.expect.map((id) => kb.sections.find((s) => s.id === id).title).join(", ") : "must say: not in the rules"}`));
  } else {
    const out = await runEval(kb, set, makeLLM({ ...process.env, LLM_PROVIDER: "anthropic" }));
    for (const r of out.results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.q}\n      ${r.answer}`);
    console.log(`\n${out.pass}/${out.total} passed`);
  }
}
