/* Photo look, one source for the node pipeline (sharp) and the phone app (canvas).
   Only global, honest changes: levels, a little brightness, a little colour, a mild colour-cast fix.
   Never: generative fill, retouching skin or food, adding objects, changing what the thing looks like.
   All functions are pure. */

/* presets per niche: how far we may go.
   sat = saturation factor, maxGain = max contrast stretch, targetMean = wanted mid brightness (0..255),
   maxGamma = max midtone lift (brightens without burning the whites), wb = colour-cast fix strength */
export const PRESETS = {
  salon: { sat: 1.06, maxGain: 1.45, targetMean: 132, maxGamma: 1.5, wb: 0.35 },
  cafe: { sat: 1.1, maxGain: 1.4, targetMean: 128, maxGamma: 1.45, wb: 0.15 },
  shop: { sat: 1.0, maxGain: 1.5, targetMean: 135, maxGamma: 1.6, wb: 0.45 },
  fitness: { sat: 1.05, maxGain: 1.4, targetMean: 125, maxGamma: 1.5, wb: 0.3 },
  other: { sat: 1.04, maxGain: 1.4, targetMean: 128, maxGamma: 1.45, wb: 0.3 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* value below which `p` (0..1) of the pixels lie; hist = 256 counts */
export function percentile(hist, p) {
  const total = hist.reduce((s, x) => s + x, 0);
  if (!total) return 0;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= total * p) return i;
  }
  return 255;
}

export function histMean(hist) {
  let n = 0, s = 0;
  for (let i = 0; i < 256; i++) { n += hist[i]; s += i * hist[i]; }
  return n ? s / n : 128;
}

/* grey-world white balance, softened: gains for r, g, b. strength 0 = off. Gains kept within 0.9..1.1 */
export function wbGains(means, strength = 0.3) {
  const [r, g, b] = means;
  const grey = (r + g + b) / 3;
  if (!grey) return [1, 1, 1];
  return [r, g, b].map((c) => clamp(1 + (grey / Math.max(c, 1) - 1) * strength, 0.9, 1.1));
}

/* hist: luminance histogram (256). means: [r,g,b] channel means.
   Curve per channel c: x = clamp((v * wb[c] - lo) / (hi - lo), 0, 1); out = 255 * x ^ (1 / gamma); then saturation.
   Black point only moves a little (lo <= 25), white point stretch is capped, the lift is a midtone gamma:
   the photo gets brighter, never darker, and whites are not burnt. */
export function computeParams(hist, means, niche = "other", overrides = {}) {
  const P = { ...(PRESETS[niche] || PRESETS.other), ...overrides };
  const lo = Math.min(percentile(hist, 0.005), 25);
  let hi = Math.max(percentile(hist, 0.995), 180);
  if (255 / (hi - lo) > P.maxGain) hi = lo + 255 / P.maxGain;
  hi = Math.min(hi, 255);
  const mean = histMean(hist);
  /* mean brightness of the result for a given gamma, straight from the histogram */
  const outMean = (g) => {
    let n = 0, sum = 0;
    for (let v = 0; v < 256; v++) {
      if (!hist[v]) continue;
      n += hist[v];
      sum += hist[v] * 255 * Math.pow(clamp((v - lo) / (hi - lo), 0, 1), 1 / g);
    }
    return n ? sum / n : 128;
  };
  /* smallest gamma that reaches the target; never below the original brightness (the stretch alone can darken mids) */
  const solve = (want, cap) => {
    if (outMean(1) >= want) return 1;
    if (outMean(cap) < want) return cap;
    let a = 1, b = cap;
    for (let i = 0; i < 25; i++) { const m = (a + b) / 2; if (outMean(m) >= want) b = m; else a = m; }
    return b;
  };
  const gamma = Math.max(solve(P.targetMean, P.maxGamma), solve(mean + 0.5, 3));
  const wb = wbGains(means, P.wb).map((x) => +x.toFixed(4));
  return { wb, lo: +lo.toFixed(2), hi: +hi.toFixed(2), gamma: +gamma.toFixed(4), saturation: P.sat };
}

/* 256-entry lookup table for channel c (0 r, 1 g, 2 b) */
export function lut(params, c) {
  const t = new Uint8ClampedArray(256);
  const { wb, lo, hi, gamma } = params;
  for (let v = 0; v < 256; v++) {
    const x = clamp((v * wb[c] - lo) / (hi - lo), 0, 1);
    t[v] = Math.round(255 * Math.pow(x, 1 / gamma));
  }
  return t;
}

/* the same curve as an ffmpeg lutrgb expression for channel c */
export function ffmpegExpr(params, c) {
  const { wb, lo, hi, gamma } = params;
  return `'clip(255*pow(clip((val*${wb[c]}-${lo})/${+(hi - lo).toFixed(3)},0,1),${+(1 / gamma).toFixed(4)}),0,255)'`;
}

/* stats from RGBA pixel data (canvas ImageData.data or a raw buffer with `channels`) */
export function statsFromPixels(data, channels = 4, step = 1) {
  const hist = new Array(256).fill(0);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += channels * step) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    hist[Math.round(0.299 * R + 0.587 * G + 0.114 * B)]++;
    r += R; g += G; b += B; n++;
  }
  return { hist, means: n ? [r / n, g / n, b / n] : [128, 128, 128] };
}

/* apply params in place on RGB(A) pixel data (phone app canvas and node pipeline use this same code) */
export function applyToPixels(data, params, channels = 4) {
  const L = [lut(params, 0), lut(params, 1), lut(params, 2)];
  const s = params.saturation;
  for (let i = 0; i < data.length; i += channels) {
    let R = L[0][data[i]], G = L[1][data[i + 1]], B = L[2][data[i + 2]];
    if (s !== 1) {
      const Y = 0.299 * R + 0.587 * G + 0.114 * B;
      R = Y + (R - Y) * s; G = Y + (G - Y) * s; B = Y + (B - Y) * s;
    }
    data[i] = clamp(Math.round(R), 0, 255);
    data[i + 1] = clamp(Math.round(G), 0, 255);
    data[i + 2] = clamp(Math.round(B), 0, 255);
  }
  return data;
}

/* output sizes. feed 4:5 is what Instagram shows best in the grid and feed; story 9:16 is for stories and WhatsApp status */
export const SIZES = {
  feed: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

/* centre crop box (sx, sy, sw, sh) to fill a target aspect, used by the app canvas */
export function coverBox(srcW, srcH, dstW, dstH) {
  const s = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / s, sh = dstH / s;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}
