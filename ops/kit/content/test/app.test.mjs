import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tokenFrom } from "../app/app.js";

const TOK = "abcdefghijklmnopqrstuvwxyz0123456789";

test("app token: from the link, from storage, from a pasted link; manifest keeps the #t= start", async () => {
  assert.equal(tokenFrom("#t=" + TOK, null), TOK);
  assert.equal(tokenFrom("", TOK), TOK);
  assert.equal(tokenFrom("#t=" + TOK, "old-token-old-token-old"), TOK);
  assert.equal(tokenFrom("#t=short", null), null);
  assert.equal(tokenFrom("t=" + ("https://photo-app.example.workers.dev/#t=" + TOK).replace(/^.*#t=/, ""), null), TOK);
  const man = JSON.parse(await readFile(new URL("../app/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(man.start_url, undefined, "start_url would drop the token on iPhone home-screen apps");
  const app = await readFile(new URL("../app/app.js", import.meta.url), "utf8");
  assert.ok(!/replaceState/.test(app), "the token must stay in the URL until the app is on the home screen");
});
