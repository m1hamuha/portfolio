/* Offline tests: no network. The Anthropic path is tested with a fake fetch. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { periodDates, periodRange, spread, buildPlan, planCap, PLANS } from "../src/plan.mjs";
import { prices, times, checkCaption, tidy, hasWeightLoss } from "../src/guard.mjs";
import { systemPrompt, userContent, writeCaption, allowedText } from "../src/captions.mjs";
import { makeLLM, parseJSON } from "../src/llm.mjs";
import { parseNotes, parseFree, readInbox, noteFor } from "../src/inbox.mjs";
import { approvalText, planCSV, parseApproval, msg } from "../src/render.mjs";
import { runPlan } from "../bin/social.mjs";
import MSG from "../templates/messages.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const load = async (f) => JSON.parse(await readFile(join(here, "..", f), "utf8"));
const salon = await load("clients/salon-lila.example.json");
const cafe = await load("clients/cafe-tamara.example.json");

test("periods: month and week ranges", () => {
  assert.deepEqual(periodRange("2026-02"), ["2026-02-01", "2026-02-28"]);
  assert.deepEqual(periodDates("2026-12", ["tue", "fri"]).slice(0, 3), ["2026-12-01", "2026-12-04", "2026-12-08"]);
  assert.deepEqual(periodDates("2026-12-07..2026-12-13", ["wed", "sat"]), ["2026-12-09", "2026-12-12"]);
  assert.throws(() => periodRange("2026-13"));
  assert.throws(() => periodRange("2026-12-10..2026-12-01"));
  assert.throws(() => periodDates("2026-12", ["xyz"]));
});

test("spread keeps first and last and the count", () => {
  const l = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  assert.deepEqual(spread(l, 3), [1, 5, 9]);
  assert.equal(spread(l, 20).length, 9);
  assert.deepEqual(spread(l, 0), []);
});

test("plan: closed days skipped, free slot announced before the day, missing photos flagged", () => {
  const inbox = { photos: [{ file: "a.jpg", note: "x" }, { file: "b.jpg", note: "y" }, { file: "c.jpg", note: "z" }], free: parseFree("2026-12-11 Fr 16:00 frei") };
  const { slots, warnings } = buildPlan(salon, "2026-12", inbox);
  assert.equal(slots.length, 8);
  assert.ok(!slots.some((s) => s.date === "2026-12-24"));
  const withFree = slots.find((s) => s.free);
  assert.equal(withFree.date, "2026-12-08");
  assert.equal(withFree.theme, "free_slot");
  assert.ok(slots.slice(3).every((s) => s.needs_photo));
  assert.ok(warnings.some((w) => w.includes("no photo")));
  assert.equal(slots.find((s) => s.date === "2026-12-18").special, "Letzte Termine vor Weihnachten");
});

test("plan: weekly range ignores posts_per_month", () => {
  const { slots } = buildPlan(cafe, "2026-12-07..2026-12-13", { photos: [{ file: "a.jpg" }, { file: "b.jpg" }], free: [] });
  assert.deepEqual(slots.map((s) => s.date), ["2026-12-09", "2026-12-12"]);
  assert.ok(slots.every((s) => !s.free));
});

test("guard: prices and times must come from the owner", () => {
  assert.deepEqual(prices("Suppe 6 €, Latte €3,50 und 19 EUR"), ["6", "3.5", "19"]);
  assert.deepEqual(times("um 16:00, 9 Uhr, 4 pm"), [960, 540, 960]);
  const ok = checkCaption({ caption: "Suppe des Tages 6 €, bis Sonntag." }, { niche: "cafe", allowedText: "Suppe 6 €" });
  assert.deepEqual(ok, []);
  const bad = checkCaption({ caption: "Suppe 7 € ab 12:00 \u2014 garantiert lecker #a #b #c #d #e #f" }, { niche: "cafe", allowedText: "Suppe 6 €" });
  assert.ok(bad.some((p) => p.includes("price 7")));
  assert.ok(bad.some((p) => p.includes("time 12:00")));
  assert.ok(bad.some((p) => p.includes("garantiert")));
  assert.ok(bad.some((p) => p.includes("hashtags")));
  assert.ok(bad.some((p) => p.includes("long dash")));
  assert.ok(checkCaption({ caption: "Abnehmen in 4 Wochen" }, { niche: "fitness" }).length > 0);
  assert.deepEqual(tidy({ caption: "A \u2014 B", hashtags: ["x", "#x", "y z"] }), { caption: "A, B", status_text: "", alt: "", hashtags: ["#x", "#yz"] });
});

test("prompt: language, second language, niche rules, no invented facts", () => {
  const sys = systemPrompt(salon);
  assert.match(sys, /in German, then an empty line and the same caption in Russian/);
  assert.match(sys, /Never invent prices/);
  assert.match(sys, /medical/);
  const blocks = userContent(salon, { date: "2026-12-08", weekday: "tue", theme: "free_slot", note: "French", free: "2026-12-11 Fr 16:00 frei" }, { media_type: "image/jpeg", data: "AAA" });
  assert.equal(blocks[0].type, "image");
  assert.match(blocks[1].text, /FREE SLOT: 2026-12-11 Fr 16:00 frei/);
  assert.match(blocks[1].text, /Maniküre mit Gel 35 €/);
});

test("writeCaption retries once with the problems, then flags", async () => {
  const seen = [];
  const replies = [
    JSON.stringify({ caption: "Gel 40 €", status_text: "x", alt: "a", hashtags: [] }),
    JSON.stringify({ caption: "Maniküre mit Gel 35 €. Freitag 16:00 frei.", status_text: "Fr 16:00 frei", alt: "Rote Nägel", hashtags: ["nägelleipzig"] }),
  ];
  const llm = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: (a) => { seen.push(a); return replies[seen.length - 1]; } });
  const slot = { date: "2026-12-08", weekday: "tue", theme: "free_slot", note: "", free: "2026-12-11 Fr 16:00 frei" };
  const cap = await writeCaption(llm, salon, slot);
  assert.equal(seen.length, 2);
  assert.match(seen[1].content.at(-1).text, /price 40 not given/);
  assert.deepEqual(cap.problems, []);
  assert.deepEqual(cap.hashtags, ["#nägelleipzig"]);
  const always = makeLLM({ LLM_PROVIDER: "mock", MOCK_REPLY: "no json here" });
  const flagged = await writeCaption(always, salon, slot);
  assert.deepEqual(flagged.problems, ["answer was not JSON"]);
  assert.ok(allowedText(salon, slot).includes("16:00"));
});

test("anthropic provider: request shape with a fake fetch, key from env only", async () => {
  let req;
  const fakeFetch = async (url, init) => {
    req = { url, init, body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: '{"caption":"Hallo"}' }] }) };
  };
  const llm = makeLLM({ ANTHROPIC_API_KEY: "test-key" }, fakeFetch);
  const out = await llm.complete({ system: "S", content: [{ type: "text", text: "T" }] });
  assert.equal(out, '{"caption":"Hallo"}');
  assert.equal(req.url, "https://api.anthropic.com/v1/messages");
  assert.equal(req.init.headers["x-api-key"], "test-key");
  assert.equal(req.init.headers["anthropic-version"], "2023-06-01");
  assert.equal(req.body.model, "claude-haiku-5-5");
  assert.equal(req.body.system, "S");
  await assert.rejects(makeLLM({}, fakeFetch).complete({ system: "", content: "x" }), /ANTHROPIC_API_KEY/);
  const refusal = makeLLM({ ANTHROPIC_API_KEY: "k" }, async () => ({ ok: true, json: async () => ({ stop_reason: "refusal", content: [] }) }));
  assert.equal(await refusal.complete({ system: "", content: "x" }), "");
  const err = makeLLM({ ANTHROPIC_API_KEY: "k" }, async () => ({ ok: false, status: 529, text: async () => "overloaded" }));
  await assert.rejects(err.complete({ system: "", content: "x" }), /529/);
  assert.deepEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
});

test("inbox parsing", async () => {
  assert.deepEqual(parseNotes("# c\na.jpg | Suppe 6 €\nbad line"), { "a.jpg": "Suppe 6 €" });
  assert.deepEqual(parseFree("2026-12-16 Mi 11:00\nSamstag vormittag"), [{ date: null, text: "Samstag vormittag" }, { date: "2026-12-16", text: "2026-12-16 Mi 11:00" }]);
  const inbox = await readInbox(join(here, "../examples/inbox-salon"));
  assert.equal(inbox.photos.length, 3);
  assert.equal(inbox.photos[2].note, "French, Maniküre mit Gel 35 €");
  assert.equal(inbox.free.length, 2);
  const notes = parseNotes("01-red.jpg | Rot\nclip.mov | Kniebeuge");
  assert.equal(noteFor(notes, "01-red_feed.jpg"), "Rot");
  assert.equal(noteFor(notes, "clip_clip.mp4"), "Kniebeuge");
  assert.equal(noteFor(notes, "other.jpg"), "");
});

test("approval reply parsing in 4 languages", () => {
  for (const t of ["да", "Так", "ja", "Ok 👍", "yes!"]) assert.equal(parseApproval(t).all, true, t);
  const r = parseApproval("Да, но 2: цена 7 €\n5) убрать");
  assert.equal(r.all, false);
  assert.equal(r.approvedRest, true);
  assert.deepEqual(r.changes, [{ n: 2, text: "цена 7 €" }, { n: 5, text: "убрать", drop: true }]);
  assert.equal(parseApproval("данные").all, false);
  /* a wish without "2:" must never be read as a plain yes */
  for (const t of ["Да, но 2 поменять фото", "ok aber Post 3 bitte ohne Preis", "да, только второй пост убери", "yes but change the price", "так, але без ціни", "Нет, подожди"]) {
    const x = parseApproval(t);
    assert.equal(x.all, false, t);
    assert.equal(x.unclear, true, t);
  }
  assert.equal(parseApproval("да!!! супер").all, true);
  assert.deepEqual(parseApproval("ja, 1. passt, 2. Preis 7 €").changes.map((c) => c.n), [1, 2]);
});

test("messages: every template has ru, uk, de, en and no long dashes", () => {
  for (const [k, v] of Object.entries(MSG)) {
    if (k.startsWith("_")) continue;
    for (const l of ["ru", "uk", "de", "en"]) {
      assert.ok(v[l], `${k}.${l}`);
      assert.ok(!/[\u2013\u2014]/.test(v[l]), `${k}.${l} has a long dash`);
    }
  }
  assert.match(msg("scheduled_done", "de", { n: 8, date: "01.12" }), /8 Posts/);
});

test("end to end with mock model: files written, missing photos not captioned", async () => {
  const out = join(tmpdir(), `social-test-${process.pid}`);
  const { posts } = await runPlan({ client: join(here, "../clients/salon-lila.example.json"), period: "2026-12", inbox: join(here, "../examples/inbox-salon"), out, mock: true }, {});
  assert.equal(posts.length, 8);
  assert.equal(posts.filter((p) => p.caption).length, 3);
  const appr = await readFile(join(out, "approval.txt"), "utf8");
  assert.match(appr, /Посты на 2026-12 для Nagelstudio Lila: 8 шт/);
  assert.match(appr, /Жду фото/);
  assert.match(appr, /напиши «да»/);
  const csv = await readFile(join(out, "plan.csv"), "utf8");
  assert.equal(csv.match(/^"\d+",/gm).length, 8);
  assert.ok(approvalText(cafe, "x", []).startsWith("Пости"));
  assert.match(planCSV([{ n: 1, caption: 'a "b"', hashtags: [] }]), /"a ""b"""/);
  await rm(out, { recursive: true, force: true });
});

test("plan: tariff caps posts (plan1 = about 8 a month, never 12)", async () => {
  const other = await load("clients/other-blumen.example.json");
  assert.equal(other.plan, "plan1");
  assert.equal(planCap(other, "2026-12"), PLANS.plan1.max_month);
  const photos = Array.from({ length: 14 }, (_, i) => ({ file: `p${i}.jpg` }));
  const greedy = { ...other, schedule: { weekdays: ["mon", "tue", "wed", "thu", "fri"], posts_per_month: 12 } };
  const r = buildPlan(greedy, "2026-12", { photos, free: [] });
  assert.equal(r.slots.length, 9);
  assert.ok(r.warnings.some((w) => w.includes("plan1 allows 9")));
  /* no posts_per_month: the tariff's usual count */
  const plain = { ...other, schedule: { weekdays: ["mon", "tue", "wed", "thu", "fri"] } };
  assert.equal(buildPlan(plain, "2026-12", { photos, free: [] }).slots.length, 8);
  /* a week on plan1: at most 2 posts, even with more weekdays */
  assert.equal(buildPlan(greedy, "2026-12-07..2026-12-13", { photos, free: [] }).slots.length, 2);
  /* the example clients stay inside their tariff */
  for (const f of ["salon-lila", "cafe-tamara", "shop-wollhaus", "fitness-kraft", "other-blumen"]) {
    const c = await load(`clients/${f}.example.json`);
    assert.ok(c.schedule.posts_per_month <= planCap(c, "2026-12"), f);
  }
});

test("guard: weight-loss numbers in fitness need written consent (CHECK)", () => {
  for (const t of ["Marina: minus 6 kg!", "Минус 6 кг за 8 недель", "6 kg weniger", "down 3.5 kg", "схудла на 4 кг", "-5kg"]) assert.ok(hasWeightLoss(t), t);
  for (const t of ["First 60 kg lift", "Маша, первые 60 кг", "Hanteln 8-10 kg", "Kniebeuge mit 40 kg"]) assert.ok(!hasWeightLoss(t), t);
  const p = checkCaption({ caption: "Marinas Bewertung: minus 6 kg in 8 Wochen." }, { niche: "fitness" });
  assert.ok(p.some((x) => x.startsWith("weight-loss number")));
  assert.deepEqual(checkCaption({ caption: "Marina, 8 Wochen dabei. Zum ersten Mal 60 kg." }, { niche: "fitness" }), []);
});
