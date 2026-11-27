/* Watch.gs runs in node with small Apps Script shims. UrlFetchApp is fake: nothing leaves the machine. */
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const code = await readFile(join(here, "../drive/Watch.gs"), "utf8");

function sandbox(files, props, now) {
  const store = { ...props };
  const sent = [];
  const triggers = [];
  const ctx = {
    Date: class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } },
    JSON, Math, String, Number,
    Logger: { log: () => {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => store[k] ?? null, setProperty: (k, v) => { store[k] = v; } }) },
    DriveApp: { getFolderById: (id) => { const l = (files[id] || []).slice(); return { getFiles: () => ({ hasNext: () => l.length > 0, next: () => { const f = l.shift(); return { getName: () => f.name, getDateCreated: () => new Date(f.created) }; } }) }; } },
    UrlFetchApp: { fetch: (url, opt) => { sent.push({ url, body: JSON.parse(opt.payload) }); return { getResponseCode: () => 200 }; } },
    ScriptApp: { getProjectTriggers: () => triggers, deleteTrigger: () => {}, newTrigger: (fn) => ({ timeBased: () => ({ everyMinutes: (m) => ({ create: () => triggers.push({ fn, m, getHandlerFunction: () => fn }) }) }) }) },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, store, sent, triggers };
}

const T0 = Date.UTC(2026, 11, 7, 10, 0);
const MIN = 60000;

test("planNotify waits until uploads settle and counts kinds", () => {
  const { ctx } = sandbox({}, {}, T0);
  const files = [{ name: "a.jpg", created: T0 - 30 * MIN }, { name: "b.MOV", created: T0 - 12 * MIN }, { name: "c.heic", created: T0 - 11 * MIN }, { name: "notes.txt", created: T0 - 11 * MIN }, { name: "old.jpg", created: T0 - 999 * MIN }];
  const p = ctx.planNotify(files, T0 - 100 * MIN, T0, 10);
  assert.equal(p.notify, true);
  assert.deepEqual([p.count, p.photos, p.videos, p.heic], [3, 2, 1, 1]);
  assert.equal(ctx.planNotify(files, T0 - 100 * MIN, T0 - 5 * MIN, 10).waiting, true);
  assert.equal(ctx.planNotify(files, T0, T0, 10).notify, false);
});

test("watch sends one Telegram message per batch and remembers it", () => {
  const props = { CLIENTS_JSON: JSON.stringify([{ id: "fitness-kraft", inbox: "F1", days: 2 }]), TG_TOKEN: "t", TG_CHAT_ID: "42", "seen_fitness-kraft": String(T0 - 60 * MIN) };
  const files = { F1: [{ name: "squat.mp4", created: T0 - 20 * MIN }, { name: "1.jpg", created: T0 - 15 * MIN }] };
  const s = sandbox(files, props, T0);
  s.ctx.watch();
  assert.equal(s.sent.length, 1);
  assert.equal(s.sent[0].url, "https://api.telegram.org/bott/sendMessage");
  assert.equal(s.sent[0].body.chat_id, "42");
  assert.match(s.sent[0].body.text, /fitness-kraft: 2 new files \(1 photos, 1 videos\)\nDue: 09\.12/);
  assert.equal(s.store["seen_fitness-kraft"], String(T0 - 15 * MIN));
  s.ctx.watch();
  assert.equal(s.sent.length, 1);
});

test("setup makes one 15 minute trigger and starts from now", () => {
  const s = sandbox({}, { CLIENTS_JSON: JSON.stringify([{ id: "a", inbox: "X" }]) }, T0);
  s.ctx.setup();
  assert.equal(s.triggers.length, 1);
  assert.equal(s.triggers[0].m, 15);
  assert.equal(s.store.seen_a, String(T0));
});

test("a folder that cannot be opened does not stop the other clients, and is reported once a day", () => {
  const props = { CLIENTS_JSON: JSON.stringify([{ id: "gone", inbox: "BAD" }, { id: "fitness-kraft", inbox: "F1", days: 2 }]), TG_TOKEN: "t", TG_CHAT_ID: "42", seen_gone: "0", "seen_fitness-kraft": String(T0 - 60 * MIN) };
  const s = sandbox({ F1: [{ name: "1.jpg", created: T0 - 15 * MIN }] }, props, T0);
  const orig = s.ctx.DriveApp.getFolderById;
  s.ctx.DriveApp.getFolderById = (id) => { if (id === "BAD") throw new Error("No item with the given ID could be found"); return orig(id); };
  s.ctx.watch();
  assert.equal(s.sent.length, 2);
  assert.match(s.sent[0].body.text, /^gone: cannot open the Inbox folder/);
  assert.match(s.sent[1].body.text, /^fitness-kraft: 1 new files/);
  s.ctx.watch();
  assert.equal(s.sent.length, 2, "the error is not repeated the same day");
});
