#!/usr/bin/env node
/* One batch for one client: phone photos and videos in, finished files plus captions out.
   node bin/content.mjs run --client clients/cafe-tamara.example.json --in <folder> --out <folder> [--mock] [--no-captions]
   --in   the client's files as they came (WhatsApp export folder or the Drive "Inbox" folder, synced to the laptop)
   --out  for Drive clients: the synced "Ready" folder. Files already done (same content) are skipped.
   Needs ANTHROPIC_API_KEY for captions unless --mock. ffmpeg for videos. */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, extname, basename } from "node:path";
import sharp from "sharp";
import { makeLLM } from "../../social/src/llm.mjs";
import { parseNotes, IMAGE_EXT, VIDEO_EXT } from "../../social/src/inbox.mjs";
import { processPhoto, modelCopy } from "../pipeline/photo.mjs";
import { makeBgStep } from "../pipeline/background.mjs";
import { makeClip, makeSlideshow, frameAt, probe, hasFfmpeg, makeSrt, noteWithoutRange } from "../pipeline/video.mjs";
import { access } from "node:fs/promises";
import { computeParams, statsFromPixels } from "../app/enhance.js";
import { captionFor } from "../core/captions.mjs";
import MSG from "../templates/messages.json" with { type: "json" };

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

export const safeName = (f) => basename(f, extname(f)).normalize("NFKD").replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "file";

export function message(key, lang, vars) {
  const m = MSG[key];
  return String(m[lang] || m.en).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

async function sha1(path) {
  return createHash("sha1").update(await readFile(path)).digest("hex");
}

async function loadManifest(out) {
  try { return JSON.parse(await readFile(join(out, "manifest.json"), "utf8")); } catch { return { done: {} }; }
}

/* params for a video from one frame in the middle */
async function videoParams(input, niche, duration) {
  const png = await frameAt(input, Math.max(0, (duration || 2) / 2));
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const st = statsFromPixels(data, info.channels);
  return { params: computeParams(st.hist, st.means, niche), frame: { media_type: "image/png", data: png.toString("base64") } };
}

export function captionsText(items) {
  return items.map((it) => {
    const tags = (it.hashtags || []).join(" ");
    const head = `== ${it.outputs.map((o) => basename(o)).join(", ")} ==`;
    const check = it.problems && it.problems.length ? `\n[CHECK: ${it.problems.join("; ")}]` : "";
    return `${head}\n${it.caption || ""}${tags ? "\n\n" + tags : ""}${it.status_text ? `\n\nStatus: ${it.status_text}` : ""}${check}\n`;
  }).join("\n");
}

export async function runBatch(a, env = process.env, fetchImpl = globalThis.fetch) {
  const client = JSON.parse(await readFile(a.client, "utf8"));
  const c = client.content || {};
  const lang = client.owner_language || "ru";
  await mkdir(a.out, { recursive: true });
  const manifest = await loadManifest(a.out);
  const notes = parseNotes(await readFile(join(a.in, "notes.txt"), "utf8").catch(() => ""));
  const llm = a["no-captions"] ? null : makeLLM(a.mock ? { ...env, LLM_PROVIDER: "mock" } : env, fetchImpl);
  const bgStep = makeBgStep(c.background, env, fetchImpl);
  const ff = await hasFfmpeg();
  const names = (await readdir(a.in)).sort();
  const items = [], skipped = [], errors = [];
  const storyFiles = [];

  for (const n of names) {
    const ext = extname(n).toLowerCase();
    const isImg = IMAGE_EXT.has(ext), isVid = VIDEO_EXT.has(ext);
    if (!isImg && !isVid) continue;
    const path = join(a.in, n);
    if ((await stat(path)).size === 0) { errors.push({ file: n, error: "empty file" }); continue; }
    const hash = await sha1(path);
    if (manifest.done[hash]) { skipped.push(n); continue; }
    const note = notes[n] || "";
    const base = safeName(n);
    try {
      let outputs, image, extra = {};
      if (isImg) {
        const r = await processPhoto(path, a.out, base, { niche: client.niche, sizes: c.sizes, crop: c.crop, background: c.background && c.background.color, bgStep });
        outputs = r.files;
        storyFiles.push(...r.files.filter((f) => f.endsWith("_story.jpg")));
        if (r.lowRes) extra.warning = "low resolution source, ask for the original";
        image = llm && llm.vision ? await modelCopy(path) : null;
      } else {
        if (!ff) throw new Error("ffmpeg not installed");
        const info = await probe(path);
        const { params, frame } = await videoParams(path, client.niche, info.duration);
        let srtPath = join(a.in, basename(n, extname(n)) + ".srt");
        if (c.whisper && info.audio && !(await access(srtPath).then(() => true, () => false))) {
          srtPath = (await makeSrt(path, c.whisper, join(a.out, `${base}_subs`), c.whisper.lang || "auto")) || srtPath;
        }
        const clip = c.clip || {};
        const r = await makeClip({ input: path, output: join(a.out, `${base}_clip.mp4`), niche: client.niche, params, maxLen: clip.max_seconds || 15, note, mode: clip.mode || "cover", audio: clip.audio || "keep", srtPath });
        outputs = [r.output];
        extra = { start: r.start, seconds: r.dur, subtitles: r.subtitles };
        image = frame;
      }
      const cap = llm ? await captionFor(llm, client, { note: noteWithoutRange(note), video: isVid }, image) : { caption: "", hashtags: [], problems: [] };
      items.push({ file: n, hash, note, video: isVid, outputs, ...extra, ...cap });
    } catch (e) {
      errors.push({ file: n, error: e.message });
    }
  }

  const ss = c.slideshow || {};
  if (ff && ss.enabled && storyFiles.length >= (ss.min || 3)) {
    const pick = storyFiles.slice(0, ss.max || 6);
    const out = join(a.out, `slideshow_${new Date().toISOString().slice(0, 10)}.mp4`);
    const r = await makeSlideshow(pick, out, { each: ss.each || 2.5 });
    items.push({ file: "(slideshow)", video: true, outputs: [r.output], seconds: r.seconds, caption: "", hashtags: [], problems: [] });
  }

  for (const it of items) if (it.hash) manifest.done[it.hash] = { file: it.file, at: new Date().toISOString(), outputs: it.outputs.map((o) => basename(o)) };
  await writeFile(join(a.out, "manifest.json"), JSON.stringify(manifest, null, 2));
  /* keep the owner's notes next to the results, so the social kit can plan posts from this folder */
  const inNotes = await readFile(join(a.in, "notes.txt"), "utf8").catch(() => "");
  if (inNotes) {
    const outNotes = await readFile(join(a.out, "notes.txt"), "utf8").catch(() => "");
    const add = inNotes.split(/\r?\n/).filter((l) => l.trim() && !outNotes.includes(l));
    if (add.length) await writeFile(join(a.out, "notes.txt"), (outNotes ? outNotes.replace(/\n?$/, "\n") : "") + add.join("\n") + "\n");
  }
  const prev = await readFile(join(a.out, "captions.txt"), "utf8").catch(() => "");
  await writeFile(join(a.out, "captions.txt"), (prev ? prev + "\n" : "") + captionsText(items.filter((i) => i.caption || i.file !== "(slideshow)")));

  const photos = items.filter((i) => !i.video).length, clips = items.filter((i) => i.video).length;
  const flagged = items.filter((i) => i.problems && i.problems.length).length + errors.length;
  const key = { whatsapp: "delivery_whatsapp", link: "delivery_link", drive: "delivery_drive" }[client.delivery || "whatsapp"] || "delivery_whatsapp";
  let text = message(key, lang, { n: photos, clips, link: a.link || "{link}" });
  if (flagged) text += "\n" + message("flagged_note", lang, { flagged });
  await writeFile(join(a.out, "message.txt"), text + "\n");
  return { items, skipped, errors, message: text };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const a = args(process.argv.slice(2));
  if (a._[0] !== "run" || !a.client || !a.in || !a.out) {
    console.error("usage: content.mjs run --client <json> --in <dir> --out <dir> [--mock] [--no-captions] [--link URL]");
    process.exit(2);
  }
  runBatch(a).then((r) => {
    console.log(`${r.items.length} done, ${r.skipped.length} skipped (already done), ${r.errors.length} errors`);
    for (const e of r.errors) console.log("error:", e.file, e.error);
    for (const i of r.items) if (i.problems && i.problems.length) console.log("check:", i.file, i.problems.join("; "));
    console.log("\nMessage for the owner:\n" + r.message);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
