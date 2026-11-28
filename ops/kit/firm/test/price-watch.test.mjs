import test from "node:test";
import assert from "node:assert/strict";
import { check, report, validate, parsePrice, extractPrice, robotsAllows } from "../lib/price-watch.mjs";

test("parsePrice handles German and English formats", () => {
  assert.equal(parsePrice("1.234,50 €"), 1234.5);
  assert.equal(parsePrice("€1,234.50"), 1234.5);
  assert.equal(parsePrice("49,90"), 49.9);
  assert.equal(parsePrice("12.50"), 12.5);
  assert.equal(parsePrice("1.299"), 1299);
  assert.equal(parsePrice("ab"), null);
});

test("extractPrice: pattern, JSON-LD, meta", () => {
  assert.equal(extractPrice("<b>ab 89,00 €</b>", "ab\\s*([\\d.,]+)\\s*€"), 89);
  assert.equal(extractPrice('<script type="application/ld+json">{"offers":{"price":"129.00"}}</script>'), 129);
  assert.equal(extractPrice('<meta itemprop="price" content="15.5">'), 15.5);
  assert.equal(extractPrice("<p>Preis auf Anfrage</p>"), null);
});

test("limits: 20 pages, no marketplaces", () => {
  const pages = Array.from({ length: 21 }, (_, i) => ({ name: `p${i}`, url: `https://a.example/${i}` }));
  assert.throws(() => validate({ pages }), /at most 20/);
  assert.throws(() => validate({ pages: [{ name: "x", url: "https://www.amazon.de/dp/1" }] }), /marketplace/);
  assert.equal(validate({ pages: pages.slice(0, 20) }).length, 20);
});

test("robots.txt is respected", () => {
  const r = "User-agent: *\nDisallow: /preise\nAllow: /preise/oeffentlich\n";
  assert.equal(robotsAllows(r, "/preise/x"), false);
  assert.equal(robotsAllows(r, "/preise/oeffentlich/a"), true);
  assert.equal(robotsAllows(r, "/kontakt"), true);
});

test("check: change, login wall, missing price and robots show up in the report", async () => {
  const pages = {
    "https://a.example/robots.txt": [200, "User-agent: *\nDisallow: /intern"],
    "https://a.example/fenster": [200, '{"price":"99,00"}'],
    "https://a.example/boden": [200, '{"price":"40,00"}'],
    "https://a.example/neu": [200, "<p>kein Preis</p>"],
    "https://b.example/robots.txt": [404, ""],
    "https://b.example/konto": [403, ""],
  };
  const f = async (url) => { const [s, b] = pages[url] || [500, ""]; return { ok: s === 200, status: s, text: async () => b }; };
  const cfg = { pages: [
    { name: "A Fenster", url: "https://a.example/fenster" },
    { name: "A Boden", url: "https://a.example/boden" },
    { name: "A neu", url: "https://a.example/neu" },
    { name: "A intern", url: "https://a.example/intern/x" },
    { name: "B Konto", url: "https://b.example/konto" },
  ] };
  const prev = { "https://a.example/fenster": 89, "https://a.example/boden": 40, "https://b.example/konto": 10 };
  const r = await check(cfg, prev, f);
  assert.deepEqual(r.changes.map((c) => [c.name, c.old, c.price]), [["A Fenster", 89, 99]]);
  assert.deepEqual(r.failures.map((x) => [x.name, x.reason]), [["A neu", "no price"], ["A intern", "robots"], ["B Konto", "login"]]);
  assert.equal(r.state["https://b.example/konto"], 10);
  const m = report(r, "de");
  assert.match(m.subject, /1 \/ 3/);
  assert.match(m.body, /A Fenster: 89 -> 99/);
  assert.match(m.body, /Seite bitte prüfen:[\s\S]*B Konto: login/);
  assert.match(report({ changes: [], failures: [], same: [] }, "ru").body, /Цены не изменились/);
});

test("several JSON-LD prices: no guess, page goes to 'check this page'", async () => {
  const html = '<script type="application/ld+json">[{"price":"49.00"},{"price":"79.00"}]</script>';
  assert.equal(extractPrice(html), null);
  assert.equal(extractPrice('{"price":"49.00"} {"price":"49.00"}'), 49);
  const r = await check({ pages: [{ name: "A", url: "https://a.example/p" }] }, {}, async (u) => ({ ok: true, status: 200, text: async () => (u.endsWith("robots.txt") ? "" : html) }));
  assert.equal(r.failures[0].reason, "no price");
});

test("robots.txt: grouped User-agent lines apply to us", () => {
  assert.equal(robotsAllows("User-agent: googlebot\nUser-agent: *\nDisallow: /p\n", "/p/1"), false);
  assert.equal(robotsAllows("User-agent: googlebot\nDisallow: /p\n\nUser-agent: *\nAllow: /\n", "/p/1"), true);
});
