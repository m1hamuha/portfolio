/* Price rule, background quality gate, app caption term. Offline. */
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bill, DEFAULT_PRICES } from "../pipeline/price.mjs";
import { cutQuality, cutOk, makeBgStep } from "../pipeline/background.mjs";
import { captionsUntil } from "../bin/app-token.mjs";
import { message } from "../bin/content.mjs";
import MSG from "../templates/messages.json" with { type: "json" };

test("bill: photo €1, clip €1, clip with subtitles €3 (as 3 photos), slideshow free", () => {
  assert.deepEqual(DEFAULT_PRICES, { photo: 1, clip: 1, clip_subtitled: 3, slideshow: 0 });
  const items = [{ file: "a.jpg" }, { file: "b.jpg" }, { file: "c.mp4", video: true, subtitles: false }, { file: "d.mp4", video: true, subtitles: true }, { file: "(slideshow)", video: true }];
  const b = bill(items);
  assert.deepEqual([b.photos, b.clips, b.subtitled, b.slideshows, b.total], [2, 1, 1, 1, 6]);
  assert.equal(bill(items, { clip_subtitled: 2.5 }).total, 5.5);
  const text = message("bill", "en", { ...b, pp: 1, pc: 1, ps: 3 });
  assert.equal(text, "For this batch: photos 2 × €1, clips 1 × €1, clips with subtitles 1 × €3. Total €6.");
  for (const k of ["bill", "price_rule", "background_kept", "app_term"]) {
    for (const l of ["ru", "uk", "de", "en"]) {
      assert.ok(MSG[k][l], `${k}.${l}`);
      assert.ok(!/[\u2013\u2014]/.test(MSG[k][l]), `no long dash in ${k}.${l}`);
    }
  }
  assert.match(MSG.price_rule.ru, /3 € за ролик с субтитрами/);
});

/* a cut-out as a background tool would return it: transparent around, product opaque */
async function cut(svgInner, w = 400, h = 400) {
  return sharp(Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>`)).png().toBuffer();
}

test("background gate: clean shapes pass, fuzzy, frayed or empty cuts keep the own background", async () => {
  const clean = await cut('<rect x="100" y="120" width="200" height="160" rx="30" fill="#8a5a3a"/>');
  const q = await cutQuality(clean);
  assert.ok(cutOk(q), JSON.stringify(q));
  /* wool: the whole item half transparent */
  const fuzzy = await cut('<ellipse cx="200" cy="200" rx="150" ry="110" fill="#c0b0a0" fill-opacity="0.6"/>');
  assert.ok(!cutOk(await cutQuality(fuzzy)));
  /* fringe: many thin strands hanging off the body */
  let strands = "";
  for (let x = 82; x < 320; x += 6) strands += `<rect x="${x}" y="240" width="2" height="${60 + (x % 5) * 10}" fill="#6a4a2a"/>`;
  const fringe = await cut('<rect x="80" y="120" width="240" height="120" fill="#6a4a2a"/>' + strands);
  const qf = await cutQuality(fringe);
  assert.ok(!cutOk(qf), JSON.stringify(qf));
  /* tool found nothing */
  assert.ok(!cutOk(await cutQuality(await cut(""))));
  /* the step keeps the photo and remembers it */
  const dir = await mkdtemp(join(tmpdir(), "bg-gate-"));
  try {
    const src = join(dir, "x.jpg");
    await writeFile(src, await sharp({ create: { width: 64, height: 64, channels: 3, background: "#777" } }).jpeg().toBuffer());
    const fake = async () => ({ ok: true, arrayBuffer: async () => fuzzy });
    const step = makeBgStep({ provider: "photoroom" }, { PHOTOROOM_API_KEY: "k" }, fake);
    assert.equal(await step(src), src);
    assert.deepEqual(step.kept, [src]);
    const good = makeBgStep({ provider: "photoroom", size: 200 }, { PHOTOROOM_API_KEY: "k" }, async () => ({ ok: true, arrayBuffer: async () => clean }));
    assert.ok(Buffer.isBuffer(await good(src)));
    assert.deepEqual(good.kept, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("app term: captions_until is 12 months by default, month ends handled", () => {
  assert.equal(captionsUntil("2026-12-01"), "2027-12-01");
  assert.equal(captionsUntil("2027-01-31", 1), "2027-02-28");
  assert.equal(captionsUntil("2026-11-28", 6), "2027-05-28");
  assert.match(message("app_term", "de", { until: "2027-12-01" }), /bis 2027-12-01/);
});
