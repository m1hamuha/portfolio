/* SRT helpers for subtitles. Subtitles come from a .srt next to the video (made by whisper.cpp or typed by hand). */
const toMs = (t) => {
  const m = String(t).trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) throw new Error(`bad srt time ${t}`);
  return ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +m[4].padEnd(3, "0");
};
const fromMs = (ms) => {
  const p = (n, w = 2) => String(Math.floor(n)).padStart(w, "0");
  return `${p(ms / 3600000)}:${p((ms / 60000) % 60)}:${p((ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

export function parseSrt(text) {
  const out = [];
  for (const block of String(text).replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const [a, b] = lines[i].split("-->");
    out.push({ start: toMs(a), end: toMs(b), text: lines.slice(i + 1).join("\n").trim() });
  }
  return out;
}

export function formatSrt(cues) {
  return cues.map((c, i) => `${i + 1}\n${fromMs(c.start)} --> ${fromMs(c.end)}\n${c.text}\n`).join("\n");
}

/* keep cues inside [from, from+dur] seconds and move them to start at 0 */
export function clipSrt(cues, from, dur) {
  const a = from * 1000, b = (from + dur) * 1000;
  return cues
    .filter((c) => c.end > a && c.start < b && c.text)
    .map((c) => ({ start: Math.max(0, c.start - a), end: Math.min(b, c.end) - a, text: c.text }));
}
