/* Optional background step for product photos (shop). The product itself is never changed.
   provider "none"      : skip (default)
   provider "photoroom" : Photoroom Remove Background API, key in env PHOTOROOM_API_KEY (Mikhail's account)
   provider "command"   : any local tool that writes a PNG with transparency, e.g. rembg (free, runs offline):
                          { "provider": "command", "cmd": "rembg", "args": ["i", "{in}", "{out}"] }
   The cut-out is placed on a plain colour with some margin.
   Quality gate: a ragged or half-transparent cut (wool, fringe, glass) is not used; that photo keeps its own
   background and only gets the light fix. So the promise is "clean background where it works", never "always". */
import sharp from "sharp";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";

const run = promisify(execFile);
export const PHOTOROOM_URL = "https://sdk.photoroom.com/v1/segment";

export async function cutout(inPath, cfg = {}, env = process.env, fetchImpl = globalThis.fetch) {
  if (cfg.provider === "photoroom") {
    if (!env.PHOTOROOM_API_KEY) throw new Error("PHOTOROOM_API_KEY is not set");
    const form = new FormData();
    form.append("image_file", new Blob([await readFile(inPath)]), "photo.jpg");
    const res = await fetchImpl(env.PHOTOROOM_URL || PHOTOROOM_URL, { method: "POST", headers: { "x-api-key": env.PHOTOROOM_API_KEY }, body: form });
    if (!res.ok) throw new Error(`photoroom ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (cfg.provider === "command") {
    const dir = await mkdtemp(join(tmpdir(), "cut-"));
    const out = join(dir, "cut.png");
    try {
      await run(cfg.cmd, (cfg.args || []).map((a) => a.replace("{in}", inPath).replace("{out}", out)));
      return await readFile(out);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  return null;
}

/* place a transparent cut-out on a plain background, product takes about 80 % of the shorter side */
export async function onBackground(png, color = "#f4f2ef", size = 1600, fill = 0.8) {
  const trimmed = await sharp(png).trim().toBuffer();
  const inner = Math.round(size * fill);
  const fg = await sharp(trimmed).resize(inner, inner, { fit: "inside" }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: color } })
    .composite([{ input: fg, gravity: "centre" }])
    .flatten({ background: color })
    .png()
    .toBuffer();
}

/* Judge a cut-out by its alpha mask (scaled to 256 px):
   cover     share of the picture that is product (alpha >= 128); too little or almost all means the cut failed
   soft      share of product pixels that are half-transparent (8..247): fuzzy wool, glass, smoke
   ragged    edge length / sqrt(area); a clean shape is about 4 to 6, a frayed edge goes far above */
export async function cutQuality(png) {
  const { data, info } = await sharp(png).ensureAlpha().extractChannel(3).resize(256, 256, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  let fg = 0, soft = 0, edge = 0;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] >= 128;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = data[y * w + x];
    if (a > 7 && a < 248) soft++;
    if (a >= 128) {
      fg++;
      if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) edge++;
    }
  }
  return { cover: fg / (w * h), soft: fg ? soft / fg : 1, ragged: fg ? edge / Math.sqrt(fg) : Infinity };
}

export const QUALITY = { min_cover: 0.03, max_cover: 0.97, max_soft: 0.12, max_ragged: 14 };

export function cutOk(q, limits = {}) {
  const l = { ...QUALITY, ...limits };
  return q.cover >= l.min_cover && q.cover <= l.max_cover && q.soft <= l.max_soft && q.ragged <= l.max_ragged;
}

/* returns a function for processPhoto's bgStep, or null. step.kept lists photos that kept their own background. */
export function makeBgStep(cfg, env = process.env, fetchImpl = globalThis.fetch) {
  if (!cfg || !cfg.provider || cfg.provider === "none") return null;
  const step = async (inPath) => {
    const png = await cutout(inPath, cfg, env, fetchImpl);
    if (!png) return inPath;
    if (!cutOk(await cutQuality(png), cfg.quality)) {
      step.kept.push(inPath);
      return inPath;
    }
    return onBackground(png, cfg.color, cfg.size, cfg.fill);
  };
  step.kept = [];
  return step;
}
