#!/usr/bin/env node
/* Usage:
   node bin/social.mjs plan --client clients/salon-lila.example.json --period 2026-12 --inbox <folder> --out <folder> [--mock]
   --period: a month (2026-12) or a range (2026-12-07..2026-12-13, for weekly work). --month is the same as --period.
   node bin/social.mjs approve --text "<owner reply>"   prints what the owner approved or wants changed
   Writes approval.txt (send to owner on WhatsApp), plan.csv, plan.md, posts.json into --out.
   Needs ANTHROPIC_API_KEY unless --mock. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { makeLLM } from "../src/llm.mjs";
import { buildPlan } from "../src/plan.mjs";
import { readInbox, imageForModel } from "../src/inbox.mjs";
import { writeCaption } from "../src/captions.mjs";
import { approvalText, planCSV, planMarkdown, parseApproval } from "../src/render.mjs";

export function args(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else a._.push(argv[i]);
  }
  return a;
}

export async function runPlan(a, env = process.env, fetchImpl = globalThis.fetch) {
  a.month = a.period || a.month;
  const client = JSON.parse(await readFile(a.client, "utf8"));
  const inbox = a.inbox ? await readInbox(a.inbox) : { photos: [], free: [] };
  const { slots, warnings } = buildPlan(client, a.month, inbox);
  const llm = makeLLM(a.mock ? { ...env, LLM_PROVIDER: "mock" } : env, fetchImpl);
  const posts = [];
  for (const slot of slots) {
    if (slot.needs_photo) {
      /* no photo, no post: Instagram needs one, and we never use stock photos as the owner's work */
      posts.push({ ...slot, caption: "", status_text: "", alt: "", hashtags: [], problems: ["waiting for photo"] });
      continue;
    }
    const img = slot.photo && !slot.needs_photo && a.inbox ? await imageForModel(join(a.inbox, slot.photo)).catch(() => null) : null;
    const cap = await writeCaption(llm, client, slot, img);
    posts.push({ ...slot, ...cap });
  }
  await mkdir(a.out, { recursive: true });
  await writeFile(join(a.out, "approval.txt"), approvalText(client, a.month, posts));
  await writeFile(join(a.out, "plan.csv"), planCSV(posts));
  await writeFile(join(a.out, "plan.md"), planMarkdown(client, a.month, posts, warnings));
  await writeFile(join(a.out, "posts.json"), JSON.stringify({ client: client.id, month: a.month, model: llm.name, warnings, posts }, null, 2));
  return { posts, warnings };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const a = args(process.argv.slice(2));
  if (a._[0] === "approve" && typeof a.text === "string") {
    const r = parseApproval(a.text);
    console.log(JSON.stringify(r, null, 2));
    if (r.unclear) console.log("UNCLEAR: read the reply yourself and ask again. Nothing is approved.");
    process.exit(0);
  }
  if (a._[0] !== "plan" || !a.client || !(a.period || a.month) || !a.out) {
    console.error("usage: social.mjs plan --client <json> --period YYYY-MM|YYYY-MM-DD..YYYY-MM-DD --inbox <dir> --out <dir> [--mock]");
    process.exit(2);
  }
  runPlan(a).then(({ posts, warnings }) => {
    const flagged = posts.filter((p) => p.problems.length).length;
    console.log(`${posts.length} posts written to ${a.out}; ${flagged} need a look`);
    for (const w of warnings) console.log("warning:", w);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
