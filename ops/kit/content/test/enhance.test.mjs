import test from "node:test";
import assert from "node:assert/strict";
import { percentile, computeParams, wbGains, lut, applyToPixels, ffmpegExpr, coverBox, statsFromPixels, PRESETS } from "../app/enhance.js";

const histOf = (fn) => { const h = new Array(256).fill(0); for (let v = 0; v < 256; v++) h[v] = fn(v); return h; };
const meanOut = (h, p) => { const L = lut(p, 1); let n = 0, s = 0; h.forEach((c, v) => { n += c; s += c * L[v]; }); return s / n; };
const meanIn = (h) => { let n = 0, s = 0; h.forEach((c, v) => { n += c; s += c * v; }); return s / n; };

test("percentile", () => {
  const h = histOf((v) => (v === 10 ? 50 : v === 200 ? 50 : 0));
  assert.equal(percentile(h, 0.1), 10);
  assert.equal(percentile(h, 0.9), 200);
  assert.equal(percentile(new Array(256).fill(0), 0.5), 0);
});

test("dark photo gets a midtone lift, never darker, whites not burnt", () => {
  const dark = histOf((v) => (v >= 20 && v <= 120 ? 10 : 0));
  const p = computeParams(dark, [70, 70, 70], "cafe");
  assert.ok(p.gamma > 1 && p.gamma <= PRESETS.cafe.maxGamma, `gamma ${p.gamma}`);
  assert.ok(meanOut(dark, p) > meanIn(dark) + 15);
  assert.equal(lut(p, 1)[255], 255);
});

test("already bright photo is left almost alone", () => {
  const bright = histOf((v) => (v >= 90 && v <= 250 ? 10 : 0));
  const p = computeParams(bright, [170, 170, 170], "salon");
  assert.ok(p.gamma < 1.2, `gamma ${p.gamma}`);
  assert.ok(Math.abs(meanOut(bright, p) - meanIn(bright)) < 25);
});

test("random photos: output mean never below input mean, curve monotonic", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 200; k++) {
    const a = Math.floor(rnd() * 200), b = a + 20 + Math.floor(rnd() * (235 - a));
    const h = histOf((v) => (v >= a && v <= Math.min(b, 255) ? 1 + Math.floor(rnd() * 20) : 0));
    for (const niche of Object.keys(PRESETS)) {
      const p = computeParams(h, [128, 128, 128], niche);
      assert.ok(meanOut(h, p) >= meanIn(h) - 1, `${niche} ${a}-${b}`);
      const L = lut(p, 0);
      for (let v = 1; v < 256; v++) assert.ok(L[v] >= L[v - 1]);
    }
  }
});

test("colour cast fix is mild and capped", () => {
  assert.deepEqual(wbGains([100, 100, 100]), [1, 1, 1]);
  const g = wbGains([200, 100, 50], 1);
  assert.ok(g.every((x) => x >= 0.9 && x <= 1.1));
  assert.deepEqual(wbGains([0, 0, 0]), [1, 1, 1]);
});

test("pixels: stats and apply", () => {
  const px = new Uint8ClampedArray([10, 20, 30, 255, 200, 200, 200, 255]);
  const st = statsFromPixels(px, 4);
  assert.equal(st.hist.reduce((a, b) => a + b, 0), 2);
  const p = { wb: [1, 1, 1], lo: 0, hi: 255, gamma: 1, saturation: 1 };
  assert.deepEqual([...applyToPixels(px.slice(), p)], [...px]);
  const grey = applyToPixels(new Uint8ClampedArray([100, 150, 200, 255]), { ...p, saturation: 0 });
  assert.ok(grey[0] === grey[1] && grey[1] === grey[2]);
});

test("ffmpeg expression matches the lut", () => {
  const p = { wb: [1.02, 1, 0.98], lo: 12, hi: 210, gamma: 1.25, saturation: 1.05 };
  const e = ffmpegExpr(p, 0);
  assert.match(e, /^'clip\(255\*pow\(clip\(\(val\*1\.02-12\)\/198,0,1\),0\.8\),0,255\)'$/);
  const f = (val) => Math.min(255, Math.max(0, 255 * Math.pow(Math.min(1, Math.max(0, (val * 1.02 - 12) / 198)), 0.8)));
  for (const v of [0, 50, 128, 255]) assert.ok(Math.abs(f(v) - lut(p, 0)[v]) <= 1);
});

test("cover box", () => {
  assert.deepEqual(coverBox(2000, 1000, 1000, 1000), { sx: 500, sy: 0, sw: 1000, sh: 1000 });
  const b = coverBox(3000, 4000, 1080, 1350);
  assert.ok(Math.abs(b.sw / b.sh - 0.8) < 1e-9);
});
