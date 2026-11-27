import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile, readFile, cp, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { runBatch, safeName, message, captionsText } from "../bin/content.mjs";
import { captionFor, contentSystemPrompt, contentUser } from "../core/captions.mjs";
import { makeLLM } from "../../social/src/llm.mjs";
import { hasFfmpeg } from "../pipeline/video.mjs";
import MSG from "../templates/messages.json" with { type: "json" };

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const FF = await hasFfmpeg();

test("names and messages", () => {
  assert.equal(safeName("IMG 2041 (1).HEIC"), "IMG_2041_1");
  assert.equal(safeName("Фото.jpg"), "file");
  assert.match(message("delivery_drive", "de", { n: 5, clips: 1 }), /5 Fotos und 1 Videos/);
  for (const [k, v] of Object.entries(MSG)) {
    if (k.startsWith("_")) continue;
    for (const l of ["ru", "uk", "de", "en"]) {
      assert.ok(v[l], `${k}.${l}`);
      assert.ok(!/[\u2013\u2014]/.test(v[l]), `${k}.${l} long dash`);
    }
  }
  assert.match(captionsText([{ outputs: ["/x/a_feed.jpg"], caption: "Hi", hashtags: ["#a"], problems: ["price 9 not given by the owner"] }]), /== a_feed.jpg ==\nHi\n\n#a\n\[CHECK: price 9/);
});

test("caption prompt: one image or a set, honest rules, retry", async () => {
  const client = JSON.parse(await readFile(join(here, "../clients/salon-lila.example.json"), "utf8"));
  assert.match(contentSystemPrompt(client), /in German|German, then an empty line and the same caption in Russian/);
  assert.match(contentSystemPrompt(client), /Never invent prices/);
  const im = { media_type: "image/jpeg", data: "AAAA" };
  const blocks = contentUser(client, { note: "Nude" }, [im, im, im, im]);
  assert.equal(blocks.filter((b) => b.type === "image").length, 3);
  assert.match(blocks.at(-1).text, /a set of photos for one post/);
  const replies = ['{"caption":"Nude mit Gold, 45 €"}', '{"caption":"Nude mit Goldlinien.","hashtags":["#nägelleipzig"]}'];
  let i = 0;
  const llm = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: () => replies[i++] });
  const cap = await captionFor(llm, client, { note: "Nude mit Gold" }, im);
  assert.equal(i, 2);
  assert.equal(cap.caption, "Nude mit Goldlinien.");
  assert.deepEqual(cap.problems, []);
});

test("batch end to end (mock captions): photos, video clip with subtitles, slideshow, skip on rerun", async () => {
  const dir = await mkdtemp(join(tmpdir(), "batch-test-"));
  try {
    const inDir = join(dir, "in"), out = join(dir, "out");
    await cp(join(here, "../examples/in"), inDir, { recursive: true });
    await sharp({ create: { width: 800, height: 1000, channels: 3, background: "#554433" } }).jpeg().toFile(join(inDir, "03-extra.jpg"));
    if (FF) {
      await run("ffmpeg", ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=25:duration=5", "-c:v", "libx264", "-pix_fmt", "yuv420p", join(inDir, "04-clip.mp4")]);
      await writeFile(join(inDir, "04-clip.srt"), "1\n00:00:01,000 --> 00:00:03,000\nHallo\n");
      await writeFile(join(inDir, "notes.txt"), (await readFile(join(inDir, "notes.txt"), "utf8")) + "04-clip.mp4 | Terrasse | 1-4\n");
    }
    const clientPath = join(here, "../clients/other-blumen.example.json");
    const r = await runBatch({ client: clientPath, in: inDir, out, mock: true }, {});
    assert.deepEqual(r.errors, []);
    const files = await readdir(out);
    for (const f of ["01-suppe_feed.jpg", "01-suppe_story.jpg", "02-schal_feed.jpg", "captions.txt", "manifest.json", "message.txt", "notes.txt"]) assert.ok(files.includes(f), f);
    /* the social kit plans one post per original from this folder, with the owner's note */
    const { readInbox } = await import("../../social/src/inbox.mjs");
    const inbox = await readInbox(out);
    assert.ok(inbox.photos.every((p) => !/_story|_square/.test(p.file)));
    assert.equal(inbox.photos.find((p) => p.file === "01-suppe_feed.jpg").note, "Kürbissuppe, Suppe des Tages 6 €");
    if (FF) {
      assert.ok(files.includes("04-clip_clip.mp4"));
      assert.ok(files.some((f) => f.startsWith("slideshow_")), "slideshow from 3 photos");
      const clip = r.items.find((x) => x.file === "04-clip.mp4");
      assert.equal(clip.subtitles, true);
      assert.equal(clip.caption, "Terrasse");
    }
    const caps = await readFile(join(out, "captions.txt"), "utf8");
    assert.match(caps, /Kürbissuppe, Suppe des Tages 6 €/);
    assert.match(r.message, /^Готово: у папці «Готово»/);
    const again = await runBatch({ client: clientPath, in: inDir, out, mock: true }, {});
    assert.equal(again.items.filter((x) => x.file !== "(slideshow)").length, 0);
    assert.equal(again.skipped.length, FF ? 4 : 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
