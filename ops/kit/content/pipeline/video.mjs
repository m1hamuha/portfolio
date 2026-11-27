/* Short vertical clips with ffmpeg (must be installed: apt install ffmpeg / brew install ffmpeg).
   Builders are pure and tested; run* functions call ffmpeg.
   Look: one frame from the middle is measured and the same honest levels as photos are applied (lutrgb + eq saturation). */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SIZES, ffmpegExpr } from "../app/enhance.js";
import { parseSrt, clipSrt, formatSrt } from "./srt.mjs";

const exec = promisify(execFile);
/* never hang: ffmpeg gets 10 minutes per call, no stdin */
const run = (cmd, args, opts = {}) => exec(cmd, args, { timeout: 600000, maxBuffer: 16 << 20, ...opts });

export async function hasFfmpeg(bin = "ffmpeg") {
  try { await run(bin, ["-version"]); return true; } catch { return false; }
}

export async function probe(path) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", path]);
  const j = JSON.parse(stdout);
  const v = (j.streams || []).find((s) => s.codec_type === "video") || {};
  return { duration: Number(j.format && j.format.duration) || 0, width: v.width || 0, height: v.height || 0, audio: (j.streams || []).some((s) => s.codec_type === "audio") };
}

/* "0:12-0:30" or "12-30" or "1:02.5-1:10" in the owner's note -> { start, end } seconds */
export function parseRange(note) {
  const m = String(note || "").match(/(?:^|\s|\|)((?:\d+:)?\d+(?:\.\d+)?)\s*-\s*((?:\d+:)?\d+(?:\.\d+)?)(?=\s|$|\|)/);
  if (!m) return null;
  const sec = (t) => t.split(":").reduce((s, x) => s * 60 + Number(x), 0);
  const start = sec(m[1]), end = sec(m[2]);
  return end > start ? { start, end } : null;
}

/* the note without the time range, for the caption */
export function noteWithoutRange(note) {
  return String(note || "").replace(/(?:^|\s|\|)\s*(?:\d+:)?\d+(?:\.\d+)?\s*-\s*(?:\d+:)?\d+(?:\.\d+)?(?=\s|\||$)/, "").replace(/\s*\|\s*$/, "").trim();
}

/* where to cut: owner's range if given, else the middle part (setup and the end of a phone video are usually shaky) */
export function chooseWindow(duration, maxLen = 15, range = null) {
  if (range) {
    const end = Math.min(range.end, duration || range.end);
    return { start: range.start, dur: +Math.min(end - range.start, maxLen).toFixed(2) };
  }
  if (!duration || duration <= maxLen) return { start: 0, dur: +(duration || maxLen).toFixed(2) };
  return { start: +((duration - maxLen) / 2).toFixed(2), dur: maxLen };
}

/* escape a path for the subtitles filter */
const escFilterPath = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");

/* params from ../app/enhance.js computeParams; mode "cover" crops to 9:16, "blur" keeps the whole frame on a blurred copy */
export function clipArgs({ input, output, start, dur, params, mode = "cover", audio = "keep", srt = null, fps = 30, crf = 21 }) {
  const { w, h } = SIZES.story;
  const look = params
    ? `format=rgb24,lutrgb=r=${ffmpegExpr(params, 0)}:g=${ffmpegExpr(params, 1)}:b=${ffmpegExpr(params, 2)},eq=saturation=${params.saturation}`
    : "null";
  const subs = srt ? `,subtitles='${escFilterPath(srt)}':force_style='FontName=DejaVu Sans,FontSize=13,Outline=2,Shadow=0,MarginV=60,Alignment=2'` : "";
  let filter;
  if (mode === "blur") {
    filter = `[0:v]${look},split[a][b];[a]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=30:2,eq=brightness=-0.12[bg];[b]scale=${w}:${h}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=${fps}${subs}[v]`;
  } else {
    filter = `[0:v]${look},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps}${subs}[v]`;
  }
  const args = ["-nostdin", "-y", "-hide_banner", "-loglevel", "error", "-ss", String(start), "-t", String(dur), "-i", input, "-filter_complex", filter, "-map", "[v]"];
  if (audio === "keep") args.push("-map", "0:a?", "-c:a", "aac", "-b:a", "128k");
  else args.push("-an");
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", output);
  return args;
}

/* photos -> silent slideshow clip, each photo `each` seconds, crossfade `fade` seconds. Photos should already be 9:16. */
export function slideshowArgs({ inputs, output, each = 2.5, fade = 0.5, fps = 30 }) {
  if (!inputs.length) throw new Error("no photos for slideshow");
  const { w, h } = SIZES.story;
  const args = ["-nostdin", "-y", "-hide_banner", "-loglevel", "error"];
  for (const f of inputs) args.push("-loop", "1", "-t", String(each + fade), "-i", f);
  const parts = inputs.map((_, i) => `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps},format=yuv420p[s${i}]`);
  let last = "s0";
  for (let i = 1; i < inputs.length; i++) {
    const out = i === inputs.length - 1 ? "v" : `x${i}`;
    parts.push(`[${last}][s${i}]xfade=transition=fade:duration=${fade}:offset=${+(i * each).toFixed(2)}[${out}]`);
    last = out;
  }
  if (inputs.length === 1) parts.push(`[s0]null[v]`);
  args.push("-filter_complex", parts.join(";"), "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-t", String(+(inputs.length * each + fade).toFixed(2)), output);
  return args;
}

/* one frame from time t as PNG buffer (for measuring the look) */
export async function frameAt(input, t) {
  const dir = await mkdtemp(join(tmpdir(), "frame-"));
  const out = join(dir, "f.png");
  try {
    await run("ffmpeg", ["-nostdin", "-y", "-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", input, "-frames:v", "1", "-vf", "scale=256:-2", out]);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/* whisper.cpp command for subtitles, if Mikhail installed it (free, offline). Returns argv or null. */
export function whisperArgs(cfg, wavPath, outBase, lang = "auto") {
  if (!cfg || !cfg.cmd || !cfg.model) return null;
  return { cmd: cfg.cmd, args: ["-m", cfg.model, "-f", wavPath, "-l", lang, "-osrt", "-of", outBase] };
}

/* cut a clip; srtPath (optional) is moved to the clip window and burnt in */
export async function makeClip({ input, output, niche, params, maxLen = 15, note = "", mode = "cover", audio = "keep", srtPath = null }) {
  const info = await probe(input);
  const win = chooseWindow(info.duration, maxLen, parseRange(note));
  let tmp = null, srt = null;
  try {
    if (srtPath) {
      try {
        await access(srtPath);
        const cues = clipSrt(parseSrt(await readFile(srtPath, "utf8")), win.start, win.dur);
        if (cues.length) {
          tmp = await mkdtemp(join(tmpdir(), "srt-"));
          srt = join(tmp, "c.srt");
          await writeFile(srt, formatSrt(cues));
        }
      } catch { /* no srt: no subtitles */ }
    }
    await run("ffmpeg", clipArgs({ input, output, start: win.start, dur: win.dur, params, mode, audio: info.audio ? audio : "mute", srt }));
    return { output, ...win, subtitles: !!srt, source: info };
  } finally {
    if (tmp) await rm(tmp, { recursive: true, force: true });
  }
}

export async function makeSlideshow(inputs, output, opts = {}) {
  await run("ffmpeg", slideshowArgs({ inputs, output, ...opts }));
  return { output, seconds: +(inputs.length * (opts.each || 2.5) + (opts.fade || 0.5)).toFixed(2) };
}

/* subtitles via whisper.cpp: writes <outBase>.srt, returns its path, or null if whisper is not set up or fails */
export async function makeSrt(input, cfg, outBase, lang = "auto") {
  const dir = await mkdtemp(join(tmpdir(), "wav-"));
  const wav = join(dir, "a.wav");
  try {
    const w = whisperArgs(cfg, wav, outBase, lang);
    if (!w) return null;
    await run("ffmpeg", ["-nostdin", "-y", "-hide_banner", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "16000", wav]);
    await run(w.cmd.replace(/^~/, process.env.HOME || "~"), w.args.map((x) => x.replace(/^~/, process.env.HOME || "~")));
    await access(outBase + ".srt");
    return outBase + ".srt";
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
