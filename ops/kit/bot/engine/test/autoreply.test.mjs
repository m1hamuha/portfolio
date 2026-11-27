import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sheet, hoursLine } from "../../autoreply/build.mjs";
import { BUSINESSES } from "../businesses/index.js";

const ex = (f) => JSON.parse(fs.readFileSync(new URL(`../../autoreply/examples/${f}`, import.meta.url), "utf8"));

test("hours are grouped per language", () => {
  const h = { mon: ["07:00-17:00"], tue: ["07:00-17:00"], wed: ["07:00-17:00"], thu: ["07:00-17:00"], fri: ["07:00-14:00"] };
  assert.equal(hoursLine(h, "de"), "Mo-Do 07:00-17:00; Fr 07:00-14:00");
  assert.equal(hoursLine(h, "ru"), "Пн-Чт 07:00-17:00; Пт 07:00-14:00");
});

test("paste sheets: every niche and language filled, no placeholders, no long dashes", () => {
  for (const biz of [ex("trades-example.json"), ex("cleaning-example.json"), ...BUSINESSES]) {
    const s = sheet({ ...biz, autoreply: { link: "https://example.com/book", callback: { de: "2 Stunden", en: "2 hours", ru: "2 часов", uk: "2 годин" }, areas: ["Mitte"], next_open: { de: "9 Uhr", en: "9 am", ru: "9 утра", uk: "9 ранку" }, ...(biz.autoreply || {}) } });
    assert.ok(!/\{\w+\}/.test(s), `${biz.id}: leftover placeholder`);
    assert.ok(!/[\u2013\u2014]/.test(s), `${biz.id}: long dash`);
    for (const l of biz.languages) assert.ok(s.includes(`### ${l} (`) || s.includes(`_${l}:`), `${biz.id}: ${l} missing`);
  }
  const t = sheet(ex("trades-example.json"));
  assert.match(t, /Greeting message .*people not in your contacts/);
  assert.match(sheet(ex("cleaning-example.json")), /2-Zimmer-Wohnung: ab 90 €/);
});
