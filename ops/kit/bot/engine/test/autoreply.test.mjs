import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sheet, hoursLine, checkConfig, NEED_LINK } from "../../autoreply/build.mjs";
import { BUSINESSES } from "../businesses/index.js";

const ex = (f) => JSON.parse(fs.readFileSync(new URL(`../../autoreply/examples/${f}`, import.meta.url), "utf8"));

test("hours are grouped per language", () => {
  const h = { mon: ["07:00-17:00"], tue: ["07:00-17:00"], wed: ["07:00-17:00"], thu: ["07:00-17:00"], fri: ["07:00-14:00"] };
  assert.equal(hoursLine(h, "de"), "Mo-Do 07:00-17:00; Fr 07:00-14:00");
  assert.equal(hoursLine(h, "ru"), "Пн-Чт 07:00-17:00; Пт 07:00-14:00");
});

test("paste sheets: every niche and language filled, no placeholders, no long dashes", () => {
  const EX = ["trades", "cleaning", "salon", "cafe", "fitness", "other"].map((n) => ex(`${n}-example.json`));
  for (const biz of [...EX, ...BUSINESSES]) {
    const s = sheet({ ...biz, autoreply: { link: "https://example.com/book", callback: { de: "2 Stunden", en: "2 hours", ru: "2 часов", uk: "2 годин" }, areas: ["Mitte"], next_open: { de: "9 Uhr", en: "9 am", ru: "9 утра", uk: "9 ранку" }, ...(biz.autoreply || {}) } });
    assert.ok(!/\{\w+\}/.test(s), `${biz.id}: leftover placeholder`);
    assert.ok(!/[\u2013\u2014]/.test(s), `${biz.id}: long dash`);
    for (const l of biz.languages) assert.ok(s.includes(`### ${l} (`) || s.includes(`_${l}:`), `${biz.id}: ${l} missing`);
  }
  const t = sheet(ex("trades-example.json"));
  assert.match(t, /Greeting message .*people not in your contacts/);
  assert.match(sheet(ex("cleaning-example.json")), /2-Zimmer-Wohnung: ab 90 €/);
});

// Site promises (content.js, bot card at 79 EUR): each check below is one sentence of the card.
test("salon/fitness/other: a booking link is required and sent to new and night clients", () => {
  assert.deepEqual(NEED_LINK, ["salon", "fitness", "other"]);
  for (const n of NEED_LINK) {
    const biz = ex(`${n}-example.json`);
    assert.deepEqual(checkConfig(biz), []);
    const s = sheet(biz);
    const link = biz.autoreply.link;
    // greeting (new clients, during hours) and away (outside hours) both carry the link
    assert.match(s, /## Greeting message[\s\S]*## Away message/);
    for (const part of s.split("## ").filter((p) => /^(Greeting|Away)/.test(p)))
      for (const block of part.split("### ").slice(1)) assert.ok(block.includes(link), `${n}: link missing in ${block.slice(0, 20)}`);
    assert.throws(() => sheet({ ...biz, autoreply: {} }), /needs autoreply\.link/);
    assert.throws(() => sheet({ ...biz, autoreply: { link: "http://insecure.example" } }), /needs autoreply\.link/);
  }
});

test("fitness: trial terms are spelled out, a free trial reads as free", () => {
  const s = sheet(ex("fitness-example.json"));
  assert.match(s, /Probetraining: gratis/);
  assert.match(s, /Trial class: free/);
  assert.match(s, /Пробное занятие: бесплатно/);
  assert.ok(!/: 0 €/.test(s));
});

test("fitness: class times from autoreply.timetable go out with the booking link", () => {
  const biz = ex("fitness-example.json");
  const s = sheet(biz);
  assert.match(s, /Kurse: morgens Mo-Fr 7:30 und 9:00[^\n]*\nProbetraining buchen: https:\/\//);
  assert.match(s, /Classes: mornings Mon-Fri 7:30 and 9:00/);
  assert.match(s, /Группы: утром Пн-Пт 7:30 и 9:00/);
  const plain = sheet({ ...biz, autoreply: { link: biz.autoreply.link } });
  assert.ok(!/Kurse:|Classes:|Группы:/.test(plain));
  assert.match(plain, /Sa 09:00-14:00\.\nProbetraining buchen/);
});

test("cafe: table requests in WhatsApp and Instagram, Instagram stays in its own inbox", () => {
  const s = sheet(ex("cafe-example.json"));
  assert.match(s, /## Instagram \(Meta Business Suite/);
  assert.match(s, /stay in the Instagram inbox/);
  assert.match(s, /### instagram de[\s\S]*Tag, Uhrzeit, Personenzahl und Namen/);
  assert.match(s, /### instagram en[\s\S]*day, time, number of people and a name/);
  assert.ok(!/Unsere Preise:\n\n/.test(s), "empty price quick reply");
  const noIg = sheet({ ...ex("cafe-example.json"), autoreply: {} });
  assert.ok(!/Instagram \(Meta/.test(noIg));
});

test("shop: greeting only for people not in contacts, hours plus a ready catalog list", () => {
  const shop = BUSINESSES.find((b) => b.niche === "shop");
  const s = sheet(shop);
  assert.match(s, /Greeting message .*people not in your contacts/);
  assert.match(s, /Geöffnet: Mo-Fr/);
  assert.match(s, /## WhatsApp catalog[\s\S]*Batterien AA, 4 Stück \| 3,50 €/);
  assert.deepEqual(checkConfig({ ...shop, services: [] }).length, 1);
});

test("clinic: static prices and hours, asks for day and time, no health data", () => {
  const s = sheet(BUSINESSES.find((b) => b.niche === "clinic"));
  assert.match(s, /Away message/);
  assert.match(s, /Selbstzahler/);
  assert.match(s, /keine Befunde oder Gesundheitsdaten/);
  assert.match(s, /Wunschtag/);
  assert.match(s, /Sprechzeiten: Mo-/);
});
