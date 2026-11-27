/* Offline tests for the site kit. Run: node --test ops/kit/site/test/*.test.mjs  (no network) */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "../build.mjs";
import { validate, renderPage, PAGE_JS, PAGE_JS_HASH, jsonLd, phoneDigits } from "../lib/render.mjs";
import { sheet, lint } from "../gbp/checklist.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const kit = path.join(dir, "..");
const exDir = path.join(kit, "examples");
const ex = (n) => JSON.parse(fs.readFileSync(path.join(exDir, n + ".json"), "utf8"));
const LONG_DASH = /[\u2013\u2014]/;
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "site-"));

test("all example configs build without errors and warnings", () => {
  for (const n of ["salon", "shop", "fitness", "clinic", "trades"]) {
    const out = tmp();
    const r = build(ex(n), { outDir: out, baseDir: exDir, strict: true });
    assert.deepEqual(r.warnings, [], n);
    assert.ok(fs.existsSync(path.join(out, "index.html")));
    assert.ok(fs.existsSync(path.join(out, "impressum.html")) && fs.existsSync(path.join(out, "datenschutz.html")));
    for (const f of r.files.filter((f) => f.endsWith(".html"))) {
      const html = fs.readFileSync(path.join(out, f), "utf8");
      assert.ok(!LONG_DASH.test(html), `${n}/${f} long dash`);
      assert.ok(!/fonts\.googleapis|<iframe|google-analytics|googletagmanager/.test(html), `${n}/${f} external tracking`);
    }
  }
});

test("languages: one page per language, correct lang attribute, relative links", () => {
  const out = tmp();
  build(ex("salon"), { outDir: out, baseDir: exDir });
  const ru = fs.readFileSync(path.join(out, "ru", "index.html"), "utf8");
  assert.match(ru, /<html lang="ru"/);
  assert.match(ru, /Маникюр с гелем/);
  assert.match(ru, /src="\.\.\/img\/salon-1\.svg"/);
  assert.match(ru, /href="\.\.\/impressum\.html"/);
  assert.ok(fs.existsSync(path.join(out, "uk", "index.html")));
  assert.match(fs.readFileSync(path.join(out, "sitemap.xml"), "utf8"), /studio-lila\.example\/ru\//);
});

test("inline script matches the CSP hash and parses", () => {
  assert.equal(PAGE_JS_HASH, "sha256-" + crypto.createHash("sha256").update(PAGE_JS).digest("base64"));
  const html = renderPage(ex("fitness"), "de");
  assert.ok(html.includes(`<script>${PAGE_JS}</script>`));
  assert.ok(html.includes(PAGE_JS_HASH));
  assert.doesNotThrow(() => new vm.Script(PAGE_JS));
  assert.match(html.replace(/&#39;/g, "'"), /connect-src 'self' https:\/\/script\.google\.com https:\/\/script\.googleusercontent\.com/);
});

test("escaping: hostile text in config cannot inject HTML or break JSON-LD", () => {
  const b = { ...ex("salon"), name: 'Bad <script>alert(1)</script> "x"', tagline: "</script><img src=x onerror=alert(1)>" };
  const html = renderPage(b, "de");
  assert.ok(!html.includes("<script>alert(1)"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!jsonLd(b, "de").includes("</script"));
});

test("JSON-LD: opening hours and service-area business without street", () => {
  const ld = JSON.parse(jsonLd(ex("salon"), "de"));
  assert.equal(ld["@type"], "BeautySalon");
  assert.equal(ld.openingHoursSpecification.length, 5);
  assert.deepEqual(ld.openingHoursSpecification[0], { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "19:00" });
  const tr = JSON.parse(jsonLd(ex("trades"), "de"));
  assert.equal(tr.address.streetAddress, undefined);
  assert.deepEqual(tr.areaServed, ["Musterstadt", "Beispieldorf", "Nebenort"]);
  assert.ok(!renderPage(ex("trades"), "de").includes("Werkstattweg"), "hidden address stays off the page");
  assert.equal(phoneDigits("0176 0000000"), "491760000000");
});

test("validation catches bad hours, missing booking endpoint, clinic risks", () => {
  const v = validate({ ...ex("fitness"), hours: { mo: ["9-18"] }, booking: { enabled: true } });
  assert.ok(v.errors.some((e) => e.includes("09:00-18:00")));
  assert.ok(v.errors.some((e) => e.includes("booking.endpoint")));
  const c = validate({ ...ex("clinic"), photos: [{ file: "vorher-nachher.jpg" }], booking: { enabled: true, endpoint: "https://x.example/" }, legal: { owner_name: "x", email: "y" } });
  assert.ok(c.warnings.some((w) => w.includes("HWG")));
  assert.ok(c.warnings.some((w) => w.includes("chamber")));
  assert.ok(c.warnings.some((w) => w.includes("no booking form")));
  assert.throws(() => build({ id: "x" }, { outDir: tmp() }), /problems/);
});

test("open-now badge and live prices run in a fake browser", async () => {
  const biz = { ...ex("shop") };
  const html = renderPage(biz, "de");
  const attr = (n) => { const m = html.match(new RegExp(`data-${n}="([^"]*)"`)); return m && m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"); };
  const els = {};
  const mk = (id) => (els[id] = els[id] || { id, hidden: true, textContent: "", className: "", innerHTML: "", children: [], querySelectorAll: () => [] });
  const box = mk("price-list");
  const tables = [], heads = [];
  box.querySelectorAll = (sel) => (sel === "h3" ? heads : tables);
  Object.defineProperty(box, "innerHTML", { set(v) { tables.length = 0; heads.length = 0; (v.match(/<table>/g) || []).forEach(() => tables.push({ rows: [], appendChild(r) { this.rows.push(r); } })); (v.match(/<h3>/g) || []).forEach(() => heads.push({ textContent: "" })); }, get() { return ""; } });
  let fetched;
  const ctx = {
    document: {
      documentElement: { dataset: { ui: attr("ui"), tz: "Europe/Berlin", hours: attr("hours"), pricesUrl: attr("prices-url") } },
      getElementById: (id) => (id === "book-form" ? null : mk(id)),
      querySelector: () => ({ className: "" }),
      createElement: () => ({ children: [], appendChild(c) { this.children.push(c); }, textContent: "", className: "" }),
    },
    fetch: (url) => { fetched = url; return Promise.resolve({ json: () => Promise.resolve({ groups: [{ group: "Hundefutter", items: [{ name: "<b>Trockenfutter</b>", price: "41 €", from: false }] }] }) }); },
    Intl, Date, JSON, URLSearchParams,
  };
  vm.runInNewContext(PAGE_JS, ctx);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(els["open-now"].hidden, false);
  assert.match(els["open-now"].textContent, /^(Geöffnet bis \d\d:\d\d|Jetzt geschlossen)$/);
  assert.equal(fetched, "https://script.google.com/macros/s/FAKE_SHOP_DEPLOYMENT/exec?prices=1");
  assert.equal(tables[0].rows[0].children[0].textContent, "<b>Trockenfutter</b>", "text, not HTML");
  assert.equal(tables[0].rows[0].children[1].textContent, "41 €");
});

test("page script booking: thank-you only when the backend says ok", async () => {
  const run = async (answer) => {
    let listener, sent;
    const msg = { textContent: "" }, btn = { disabled: false };
    const form = { action: "https://script.google.com/macros/s/FAKE/exec", addEventListener: (ev, fn) => { listener = fn; }, querySelector: () => btn, reset() { this.wasReset = true; } };
    const ctx = {
      document: {
        documentElement: { dataset: { ui: JSON.stringify({ thanks: "THANKS", error: "ERROR" }) } },
        getElementById: (id) => (id === "book-form" ? form : id === "book-msg" ? msg : null),
        querySelector: () => null,
      },
      FormData: function () { return [["name", "Julia"]]; },
      URLSearchParams,
      fetch: (url, opts) => { sent = opts; return answer === "network" ? Promise.reject(new Error("offline")) : Promise.resolve({ json: () => Promise.resolve(answer) }); },
      Intl, Date, JSON,
    };
    vm.runInNewContext(PAGE_JS, ctx);
    listener({ preventDefault() {} });
    await new Promise((r) => setTimeout(r, 20));
    return { msg: msg.textContent, sent, reset: !!form.wasReset, btn: btn.disabled };
  };
  const ok = await run({ ok: true });
  assert.equal(ok.msg, "THANKS");
  assert.ok(ok.reset);
  assert.equal(ok.sent.mode, undefined, "normal CORS request, answer is readable");
  assert.match(String(ok.sent.body), /ajax=1/);
  assert.equal((await run({ ok: false, reason: "too many" })).msg, "ERROR");
  const net = await run("network");
  assert.equal(net.msg, "ERROR");
  assert.equal(net.btn, false);
});

/* ---------- Apps Script backend ---------- */
function loadSite({ props = {}, sheets = {} } = {}) {
  const store = { ...props }, mail = [], cache = {};
  const book = {};
  const mkSheet = (name, rows = []) => ({ name, rows: rows.map((r) => r.slice()), appendRow(r) { this.rows.push(r); }, setFrozenRows() {}, getDataRange() { const s = this; return { getValues: () => s.rows.map((r) => r.slice()) }; }, deleteRow(i) { this.rows.splice(i - 1, 1); } });
  for (const [k, v] of Object.entries(sheets)) book[k] = mkSheet(k, v);
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => store[k] ?? null }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => book[n] || null, insertSheet: (n) => (book[n] = mkSheet(n)), getUrl: () => "https://docs.google.com/spreadsheets/d/FAKE" }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ body: s, setMimeType() { return this; } }) },
    HtmlService: { createHtmlOutput: (h) => ({ html: h }) },
    MailApp: { sendEmail: (to, subject, body) => mail.push({ to, subject, body }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ create() {} }) }) }) },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(kit, "apps-script", "Site.gs"), "utf8"), ctx);
  return { ctx, book, mail };
}

test("Site.gs prices: sheet rows to JSON groups, hidden rows skipped", () => {
  const g = loadSite({ sheets: { Prices: [["Group", "Item", "Price", "From", "Show"], ["Hund", "Trockenfutter 15 kg", 39, "", ""], ["Hund", "Leine", "12,50 €", "ja", ""], ["Katze", "Alt", 5, "", "nein"], ["Katze", "Streu", 7.5, "", "ja"]] } });
  const res = JSON.parse(g.ctx.doGet({ parameter: { prices: "1" } }).body);
  assert.deepEqual(res.groups, [
    { group: "Hund", items: [{ name: "Trockenfutter 15 kg", price: "39 €", from: false }, { name: "Leine", price: "12,50 €", from: true }] },
    { group: "Katze", items: [{ name: "Streu", price: "7,5 €", from: false }] },
  ]);
});

test("Site.gs booking: stores row, mails owner, rejects bots, no consent, wrong client, floods", () => {
  const g = loadSite({ props: { OWNER_EMAIL: "owner@example.com", CLIENT_ID: "move-studio", MAX_PER_HOUR: "2" } });
  const ok = { client: "move-studio", name: "Julia", phone: "0151 1234567", slot: "Sa 10:00", consent: "yes", lang: "de" };
  assert.equal(g.ctx.handleBooking_({ ...ok, website: "spam" }), "bot");
  assert.equal(g.ctx.handleBooking_({ ...ok, consent: "" }), "no consent");
  assert.equal(g.ctx.handleBooking_({ ...ok, client: "other" }), "wrong client");
  assert.equal(g.ctx.handleBooking_({ ...ok, phone: "12" }), "missing name or phone");
  assert.equal(g.ctx.handleBooking_(ok), "ok");
  assert.equal(g.book.Bookings.rows.length, 2);
  assert.equal(g.book.Bookings.rows[1][2], "'0151 1234567");
  assert.equal(g.mail.length, 1);
  assert.match(g.mail[0].subject, /Neue Anfrage: Julia, Sa 10:00/);
  assert.match(g.ctx.doPost({ parameter: ok }).html, /Danke/);
  assert.equal(g.ctx.handleBooking_(ok), "too many");
  assert.deepEqual(JSON.parse(g.ctx.doPost({ parameter: { ...ok, ajax: "1" } }).body), { ok: false, reason: "too many" });
});

test("Site.gs booking: formula text stays text, JSON answer, one copy survives if the other fails", () => {
  const g = loadSite({ props: { OWNER_EMAIL: "owner@example.com" } });
  const ok = { name: "=HYPERLINK(\"http://evil.example\")", phone: "0151 1234567", message: "+49 call", consent: "yes" };
  assert.deepEqual(JSON.parse(g.ctx.doPost({ parameter: { ...ok, ajax: "1" } }).body), { ok: true, reason: "" });
  const row = g.book.Bookings.rows[1];
  assert.ok(row[1].startsWith("'="), "name stored as text");
  assert.ok(row[4].startsWith("'+"), "message stored as text");
  /* mail quota used up: the row is still saved, the visitor still gets ok */
  g.ctx.MailApp.sendEmail = () => { throw new Error("quota"); };
  assert.equal(g.ctx.handleBooking_({ ...ok, name: "Anna" }), "ok");
  assert.equal(g.book.Bookings.rows.length, 3);
  /* sheet broken: the mail still goes out and says so */
  const g2 = loadSite({ props: { OWNER_EMAIL: "owner@example.com" } });
  g2.ctx.LockService.getScriptLock = () => ({ waitLock() { throw new Error("lock timeout"); }, releaseLock() {} });
  assert.equal(g2.ctx.handleBooking_({ ...ok, name: "Ben" }), "ok");
  assert.match(g2.mail[0].body, /Nicht in der Tabelle gespeichert: sheet: lock timeout/);
  /* both fail: the visitor is told to call */
  g2.ctx.MailApp.sendEmail = () => { throw new Error("quota"); };
  assert.equal(g2.ctx.handleBooking_({ ...ok, name: "Cleo" }), "failed");
  assert.equal(JSON.parse(g2.ctx.doPost({ parameter: { ...ok, name: "Dora", ajax: "1" } }).body).ok, false);
});

test("Site.gs cleanup deletes bookings older than the limit", () => {
  const old = new Date(Date.now() - 100 * 864e5), fresh = new Date();
  const g = loadSite({ sheets: { Bookings: [["Received"], [old, "A"], [fresh, "B"]] } });
  g.ctx.cleanupBookings();
  assert.deepEqual(g.book.Bookings.rows.map((r) => r[1]), [undefined, "B"]);
});

test("GBP sheet: lint and content", () => {
  const md = sheet(ex("salon"));
  assert.match(md, /Lint: OK/);
  assert.match(md, /\| Dienstag \| 09:00-19:00 \|/);
  assert.match(md, /https:\/\/wa\.me\/491510000000/);
  assert.match(md, /utm_source=google/);
  const bad = lint({ ...ex("salon"), name: "Beste Nagelstudio Musterstadt günstig", gbp: { description: "Call +49 151 0000000 or www.x.de. 20% Rabatt!" } });
  assert.ok(bad.length >= 4, bad.join("\n"));
  assert.match(sheet(ex("trades")), /hide \(service-area business\)/);
  assert.match(sheet(ex("clinic")), /no before\/after/);
});

test("no long dashes in any kit file", () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(kit)) assert.ok(!LONG_DASH.test(fs.readFileSync(f, "utf8")), f);
});
