import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { processPhoto, modelCopy } from "../pipeline/photo.mjs";
import { cutout, onBackground, makeBgStep, PHOTOROOM_URL } from "../pipeline/background.mjs";

const dir = await mkdtemp(join(tmpdir(), "photo-test-"));
test.after(() => rm(dir, { recursive: true, force: true }));

/* landscape pixels stored with EXIF orientation 6 (phone held upright) plus fake GPS-like metadata */
async function phoneShot(path, { w = 1200, h = 900, color = "#4a3a30", orientation = 6 } = {}) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><circle cx="${w / 2}" cy="${h / 2}" r="${h / 3}" fill="#9a6a40"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg().withMetadata({ orientation, exif: { IFD0: { Make: "FakePhone", Model: "X1" } } }).toFile(path);
}

test("phone photo: upright, sizes right, metadata gone, brighter", async () => {
  const src = join(dir, "a.jpg");
  await phoneShot(src);
  const m0 = await sharp(src).metadata();
  assert.equal(m0.orientation, 6);
  const r = await processPhoto(src, dir, "a", { niche: "cafe", sizes: ["feed", "square", "story"] });
  assert.equal(r.files.length, 3);
  const dims = await Promise.all(r.files.map(async (f) => { const m = await sharp(f).metadata(); return [m.width, m.height, !!m.exif, m.orientation || 1]; }));
  assert.deepEqual(dims, [[1080, 1350, false, 1], [1080, 1080, false, 1], [1080, 1920, false, 1]]);
  assert.deepEqual(r.source, { width: 900, height: 1200 }); /* rotated upright */
  const before = (await sharp(src).stats()).channels[1].mean;
  const after = (await sharp(r.files[0]).stats()).channels[1].mean;
  assert.ok(after > before, `${after} > ${before}`);
  assert.equal(r.lowRes, false);
});

test("contain keeps the whole product on the plain background", async () => {
  const src = join(dir, "b.jpg");
  await phoneShot(src, { w: 1600, h: 600, orientation: 1 });
  const r = await processPhoto(src, dir, "b", { niche: "shop", sizes: ["feed"], crop: "contain", background: "#ffffff" });
  const { data } = await sharp(r.files[0]).raw().toBuffer({ resolveWithObject: true });
  assert.ok(data[0] > 245 && data[1] > 245 && data[2] > 245, "corner is background colour");
});

test("small source is flagged, model copy is small JPEG", async () => {
  const src = join(dir, "c.jpg");
  await phoneShot(src, { w: 400, h: 300, orientation: 1 });
  const r = await processPhoto(src, dir, "c", { sizes: ["feed"] });
  assert.equal(r.lowRes, true);
  const mc = await modelCopy(src, 256);
  assert.equal(mc.media_type, "image/jpeg");
  const m = await sharp(Buffer.from(mc.data, "base64")).metadata();
  assert.ok(Math.max(m.width, m.height) <= 256);
});

test("unreadable HEIC gives a clear message", async () => {
  const src = join(dir, "d.heic");
  await writeFile(src, Buffer.from("not really heic"));
  await assert.rejects(processPhoto(src, dir, "d"), /HEIC not readable|Most Compatible/);
});

test("background: photoroom request is mocked, cut-out lands on plain colour", async () => {
  const src = join(dir, "e.jpg");
  await phoneShot(src, { orientation: 1 });
  const cut = await sharp({ create: { width: 300, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from('<svg width="300" height="200"><rect x="100" y="50" width="100" height="100" fill="#c03030"/></svg>') }]).png().toBuffer();
  let call;
  const fakeFetch = async (url, init) => { call = { url, init }; return { ok: true, arrayBuffer: async () => cut }; };
  const png = await cutout(src, { provider: "photoroom" }, { PHOTOROOM_API_KEY: "test" }, fakeFetch);
  assert.equal(call.url, PHOTOROOM_URL);
  assert.equal(call.init.headers["x-api-key"], "test");
  assert.ok(call.init.body instanceof FormData && call.init.body.get("image_file"));
  const out = await onBackground(png, "#f4f2ef", 400, 0.5);
  const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 400);
  assert.deepEqual([data[0], data[1], data[2]], [0xf4, 0xf2, 0xef]);
  const mid = (200 * 400 + 200) * info.channels;
  assert.ok(data[mid] > 150 && data[mid + 1] < 90, "product in the middle");
  await assert.rejects(cutout(src, { provider: "photoroom" }, {}, fakeFetch), /PHOTOROOM_API_KEY/);
  assert.equal(makeBgStep({ provider: "none" }), null);
  const step = makeBgStep({ provider: "photoroom", size: 300 }, { PHOTOROOM_API_KEY: "k" }, fakeFetch);
  const r = await processPhoto(src, dir, "e", { niche: "shop", sizes: ["square"], crop: "contain", bgStep: step });
  assert.equal(r.files.length, 1);
});
