/* Reads an inbox folder: photos/videos plus two optional text files.
   notes.txt  one line per file:  photo1.jpg | Pumpkin soup, 6 €, until Sunday
   free.txt   one line per free slot: 2026-12-11 Fri 16:00 free   (date first is optional)
   Lines starting with # are comments. */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

export const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
export const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".3gp", ".webm"]);

export function parseNotes(text) {
  const map = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("|");
    if (i < 0) continue;
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return map;
}

export function parseFree(text) {
  const out = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const m = l.match(/^(\d{4}-\d{2}-\d{2})\s+(.*)$/);
    out.push(m ? { date: m[1], text: l } : { date: null, text: l });
  }
  return out.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

async function readOpt(p) {
  try { return await readFile(p, "utf8"); } catch { return ""; }
}

export async function readInbox(dir) {
  const names = (await readdir(dir)).sort();
  const notes = parseNotes(await readOpt(join(dir, "notes.txt")));
  const photos = [];
  for (const n of names) {
    const ext = extname(n).toLowerCase();
    if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
    const st = await stat(join(dir, n));
    photos.push({ file: n, note: notes[n] || "", video: VIDEO_EXT.has(ext), bytes: st.size });
  }
  return { dir, photos, free: parseFree(await readOpt(join(dir, "free.txt"))) };
}

/* image for the model: only small jpeg/png/webp go as is (API limit about 5 MB);
   bigger files: run the content pipeline first, it writes small copies. */
export async function imageForModel(path) {
  const ext = extname(path).toLowerCase();
  const type = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[ext];
  if (!type) return null;
  const buf = await readFile(path);
  if (buf.length > 3_500_000) return null;
  return { media_type: type, data: buf.toString("base64") };
}
