/* Shared test helpers: fake fetch router, Apps Script shim, signing. No network, no paid API. */
import fs from "node:fs";
import vm from "node:vm";
import { createHmac } from "node:crypto";

/* load Calendar.gs into a sandbox with tiny CalendarApp / ContentService / PropertiesService / LockService shims */
export function loadAppsScript(token = "secret-token") {
  const events = [];
  const mkEvent = (title, s, e, opts = {}) => ({
    title, s, e, desc: opts.description || "", reminders: [],
    getTransparency: () => "OPAQUE", isAllDayEvent: () => false,
    getStartTime: () => s, getEndTime: () => e, getId: () => `ev${events.length}`,
    addPopupReminder(m) { this.reminders.push(m); },
  });
  const cal = {
    getEvents: (from, to) => events.filter((x) => x.s < to && x.e > from),
    createEvent: (title, s, e, opts) => { const ev = mkEvent(title, s, e, opts); events.push(ev); return ev; },
  };
  const sandbox = {
    JSON, Date, String, Number,
    CalendarApp: { getDefaultCalendar: () => cal, getCalendarById: (id) => (id === "missing" ? null : cal) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ body: s, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === "TOKEN" ? token : null) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(new URL("../apps-script/Calendar.gs", import.meta.url), "utf8"), sandbox);
  const post = (obj) => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(obj) } }).body);
  return { sandbox, events, post };
}

/* fetch double: routes by URL prefix, records every call */
export function fakeFetch(routes) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = String(url);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: u, init, body });
    for (const [prefix, fn] of routes) {
      if (u.startsWith(prefix)) {
        const out = await fn(body, u, init);
        const status = out && out.__status ? out.__status : 200;
        return new Response(JSON.stringify(out), { status, headers: { "content-type": "application/json" } });
      }
    }
    throw new Error(`unexpected network call: ${u}`);
  };
  f.calls = calls;
  return f;
}

export function sign(raw, secret) { return `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`; }

export function clone(o) { return JSON.parse(JSON.stringify(o)); }
