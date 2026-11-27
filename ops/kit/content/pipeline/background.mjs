/* Optional background step for product photos (shop). The product itself is never changed.
   provider "none"      : skip (default)
   provider "photoroom" : Photoroom Remove Background API, key in env PHOTOROOM_API_KEY (Mikhail's account)
   provider "command"   : any local tool that writes a PNG with transparency, e.g. rembg (free, runs offline):
                          { "provider": "command", "cmd": "rembg", "args": ["i", "{in}", "{out}"] }
   The cut-out is placed on a plain colour with some margin. */
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

/* returns a function for processPhoto's bgStep, or null */
export function makeBgStep(cfg, env = process.env, fetchImpl = globalThis.fetch) {
  if (!cfg || !cfg.provider || cfg.provider === "none") return null;
  return async (inPath) => {
    const png = await cutout(inPath, cfg, env, fetchImpl);
    return png ? onBackground(png, cfg.color, cfg.size, cfg.fill) : inPath;
  };
}
