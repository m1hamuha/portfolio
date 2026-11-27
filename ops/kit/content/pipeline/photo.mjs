/* One photo in, finished JPEGs out. sharp only, runs on Mikhail's laptop.
   - turns the photo upright (EXIF), removes all metadata (GPS, phone model) on output
   - honest look from ../app/enhance.js (levels, light, mild colour)
   - sizes: feed 4:5, story 9:16 (whole photo on a blurred copy of itself, nothing cut off), optional square
   - optional background step (see background.mjs) for product shots */
import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import { computeParams, statsFromPixels, applyToPixels, SIZES } from "../app/enhance.js";

const run = promisify(execFile);

/* iPhone HEIC: the prebuilt sharp usually cannot read it (HEVC patents). Try heif-convert if installed. */
export async function readable(path) {
  const ext = extname(path).toLowerCase();
  if (ext !== ".heic" && ext !== ".heif") return { path, cleanup: async () => {} };
  try {
    await sharp(path).metadata();
    return { path, cleanup: async () => {} };
  } catch {
    const dir = await mkdtemp(join(tmpdir(), "heic-"));
    const out = join(dir, basename(path, ext) + ".jpg");
    try {
      await run("heif-convert", ["-q", "95", path, out]);
    } catch {
      await rm(dir, { recursive: true, force: true });
      throw new Error(`HEIC not readable: install libheif-examples (heif-convert) or ask the owner to send JPEG (iPhone: Settings, Camera, Formats, Most Compatible)`);
    }
    return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }) };
  }
}

/* stats on a small upright copy */
export async function analyse(input) {
  const { data, info } = await sharp(input).rotate().resize(256, 256, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return statsFromPixels(data, info.channels);
}

/* apply look with the same pixel code as the phone app; returns a sharp pipeline (upright, enhanced, sRGB) */
export async function enhanced(input, niche, overrides = {}) {
  const st = await analyse(input);
  const params = computeParams(st.hist, st.means, niche, overrides);
  const { data, info } = await sharp(input).rotate().toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  applyToPixels(data, params, info.channels);
  const img = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  return { img, params };
}

async function story(buf) {
  /* whole photo centred, background = same photo blurred and darkened: nothing is cut, nothing invented */
  const { w, h } = SIZES.story;
  const bg = await sharp(buf).resize(w, h, { fit: "cover" }).blur(40).modulate({ brightness: 0.7 }).toBuffer();
  const fg = await sharp(buf).resize(w, h, { fit: "inside" }).toBuffer();
  return sharp(bg).composite([{ input: fg, gravity: "centre" }]);
}

/* opts: { niche, sizes: ["feed","story"], crop: "cover"|"contain", background: "#f4f2ef", quality, overrides, bgStep } */
export async function processPhoto(inPath, outDir, name, opts = {}) {
  const niche = opts.niche || "other";
  const sizes = opts.sizes || ["feed", "story"];
  const q = opts.quality || 88;
  const src = await readable(inPath);
  try {
    let input = src.path;
    if (opts.bgStep) input = await opts.bgStep(input); /* returns a Buffer with the product on a clean background */
    const { img, params } = await enhanced(input, niche, opts.overrides);
    const base = await img.png().toBuffer();
    const meta = await sharp(base).metadata();
    const files = [];
    for (const s of sizes) {
      const out = join(outDir, `${name}_${s}.jpg`);
      let p;
      if (s === "story") p = await story(base);
      else {
        const { w, h } = SIZES[s];
        p = opts.crop === "contain"
          ? sharp(base).resize(w, h, { fit: "contain", background: opts.background || "#f4f2ef" })
          : sharp(base).resize(w, h, { fit: "cover", position: sharp.strategy.attention });
      }
      await p.jpeg({ quality: q }).toFile(out); /* baseline JPEG (ffmpeg and old phones read it), sharp writes no EXIF/GPS unless asked */
      files.push(out);
    }
    return { files, params, source: { width: meta.width, height: meta.height }, lowRes: Math.min(meta.width, meta.height) < 720 };
  } finally {
    await src.cleanup();
  }
}

/* a small copy for the caption model (keeps cost low and stays under the API image limit) */
export async function modelCopy(inPath, max = 768) {
  const src = await readable(inPath);
  try {
    const buf = await sharp(src.path).rotate().resize(max, max, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
    return { media_type: "image/jpeg", data: buf.toString("base64") };
  } finally {
    await src.cleanup();
  }
}
