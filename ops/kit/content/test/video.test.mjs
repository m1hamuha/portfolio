import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseRange, chooseWindow, clipArgs, slideshowArgs, whisperArgs, noteWithoutRange, hasFfmpeg, makeClip, makeSlideshow, probe } from "../pipeline/video.mjs";
import { parseSrt, formatSrt, clipSrt } from "../pipeline/srt.mjs";

const run = promisify(execFile);
const FF = await hasFfmpeg();

test("time range in the note", () => {
  assert.deepEqual(parseRange("Kniebeuge 0:12-0:30"), { start: 12, end: 30 });
  assert.deepEqual(parseRange("Terrasse | 1-5"), { start: 1, end: 5 });
  assert.equal(parseRange("6 Farben, 19 €"), null);
  assert.equal(parseRange("30-12"), null);
  assert.equal(noteWithoutRange("Terrasse | 1-5"), "Terrasse");
  assert.equal(noteWithoutRange("0:12-0:30 Kniebeuge"), "Kniebeuge");
});

test("window: owner range, middle part, short videos whole", () => {
  assert.deepEqual(chooseWindow(60, 15), { start: 22.5, dur: 15 });
  assert.deepEqual(chooseWindow(8, 15), { start: 0, dur: 8 });
  assert.deepEqual(chooseWindow(60, 15, { start: 10, end: 40 }), { start: 10, dur: 15 });
  assert.deepEqual(chooseWindow(20, 15, { start: 10, end: 40 }), { start: 10, dur: 10 });
});

test("ffmpeg arguments", () => {
  const p = { wb: [1, 1, 1], lo: 10, hi: 230, gamma: 1.2, saturation: 1.05 };
  const a = clipArgs({ input: "in.mov", output: "out.mp4", start: 3, dur: 15, params: p, audio: "mute", srt: "/tmp/x:y.srt" });
  const f = a[a.indexOf("-filter_complex") + 1];
  assert.match(f, /lutrgb=r='clip/);
  assert.match(f, /scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920/);
  assert.match(f, /subtitles='\/tmp\/x\\:y.srt'/);
  assert.ok(a.includes("-an") && a.includes("+faststart") && a.includes("yuv420p"));
  const b = clipArgs({ input: "i", output: "o", start: 0, dur: 5, params: null, mode: "blur" });
  assert.match(b[b.indexOf("-filter_complex") + 1], /boxblur/);
  assert.ok(b.includes("0:a?"));
  const s = slideshowArgs({ inputs: ["a", "b", "c"], output: "s.mp4", each: 2, fade: 0.5 });
  const sf = s[s.indexOf("-filter_complex") + 1];
  assert.match(sf, /xfade=transition=fade:duration=0.5:offset=2\[x1\]/);
  assert.match(sf, /offset=4\[v\]/);
  assert.equal(s[s.lastIndexOf("-t") + 1], "6.5");
  assert.throws(() => slideshowArgs({ inputs: [], output: "x" }));
  assert.deepEqual(whisperArgs({ cmd: "whisper-cli", model: "m.bin" }, "a.wav", "out"), { cmd: "whisper-cli", args: ["-m", "m.bin", "-f", "a.wav", "-l", "auto", "-osrt", "-of", "out"] });
  assert.equal(whisperArgs(null, "a", "b"), null);
});

test("srt: parse, cut to the clip window, format", () => {
  const cues = parseSrt("1\n00:00:01,000 --> 00:00:03,500\nHallo\n\n2\n00:00:10,000 --> 00:00:12,000\nZwei\nZeilen\n");
  assert.equal(cues.length, 2);
  assert.equal(cues[1].text, "Zwei\nZeilen");
  const c = clipSrt(cues, 2, 9);
  assert.deepEqual(c, [{ start: 0, end: 1500, text: "Hallo" }, { start: 8000, end: 9000, text: "Zwei\nZeilen" }]);
  assert.match(formatSrt(c), /^1\n00:00:00,000 --> 00:00:01,500\nHallo\n/);
  assert.throws(() => parseSrt("1\nxx --> yy\nA"));
});

test("real ffmpeg run: clip with subtitles, slideshow", { skip: !FF && "ffmpeg not installed" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "video-test-"));
  try {
    const src = join(dir, "v.mp4");
    await run("ffmpeg", ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=25:duration=6", "-f", "lavfi", "-i", "sine=frequency=440:duration=6", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", src]);
    const srt = join(dir, "v.srt");
    await writeFile(srt, "1\n00:00:02,000 --> 00:00:04,000\nKnie raus\n");
    const r = await makeClip({ input: src, output: join(dir, "c.mp4"), params: { wb: [1, 1, 1], lo: 5, hi: 240, gamma: 1.1, saturation: 1.05 }, maxLen: 3, note: "x 1-4", srtPath: srt });
    assert.equal(r.start, 1);
    assert.equal(r.dur, 3);
    assert.equal(r.subtitles, true);
    const info = await probe(r.output);
    assert.equal(info.width, 1080);
    assert.equal(info.height, 1920);
    assert.ok(Math.abs(info.duration - 3) < 0.3, `duration ${info.duration}`);
    assert.equal(info.audio, true);
    const imgs = [];
    for (const [i, c] of ["#a33", "#3a3", "#33a"].entries()) {
      const p = join(dir, `${i}.jpg`);
      await sharp({ create: { width: 540, height: 960, channels: 3, background: c } }).jpeg().toFile(p);
      imgs.push(p);
    }
    const s = await makeSlideshow(imgs, join(dir, "s.mp4"), { each: 1, fade: 0.5 });
    const si = await probe(s.output);
    assert.ok(Math.abs(si.duration - 3.5) < 0.3, `slideshow ${si.duration}`);
    assert.equal(si.audio, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
