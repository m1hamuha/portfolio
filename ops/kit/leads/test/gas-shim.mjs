// Minimal Google Apps Script shims so .gs files run in node for offline tests.
// Nothing here talks to the network: UrlFetchApp calls a handler the test provides.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function fmt(date, tz, pattern) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23"
  }).formatToParts(date).map(p => [p.type, p.value]));
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const off = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const z = (off < 0 ? "-" : "+") + String(Math.floor(Math.abs(off) / 60)).padStart(2, "0") + String(Math.abs(off) % 60).padStart(2, "0");
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss|u|Z/g, t => ({ yyyy: parts.year, MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second, u: String(wd), Z: z })[t]);
}

class FakeRange {
  constructor(sheet, r, c, nr = 1, nc = 1) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push((this.sheet.data[this.r - 1 + i] || [])[this.c - 1 + j] ?? ""); out.push(row); }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValue(v) { while (this.sheet.data.length < this.r) this.sheet.data.push([]); this.sheet.data[this.r - 1][this.c - 1] = v; return this; }
  setValues(vals) { vals.forEach((row, i) => row.forEach((v, j) => new FakeRange(this.sheet, this.r + i, this.c + j).setValue(v))); return this; }
  insertCheckboxes() { return this; }
  setDataValidation() { return this; }
  setNumberFormat() { return this; }
  setFormula(f) { return this.setValue(f); }
  sort(spec) { this.sheet.sorted = spec; const rows = this.sheet.data.slice(this.r - 1, this.r - 1 + this.nr); this.sheet.sortRows?.(rows, spec); this.sheet.data.splice(this.r - 1, this.nr, ...rows); return this; }
}
class FakeSheet {
  constructor(name, data = []) { this.name = name; this.data = data.map(r => r.slice()); }
  getName() { return this.name; }
  appendRow(r) { this.data.push(r.slice()); return this; }
  getLastRow() { return this.data.length; }
  getLastColumn() { return Math.max(0, ...this.data.map(r => r.length)); }
  getDataRange() { return new FakeRange(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  getRange(r, c, nr = 1, nc = 1) { return new FakeRange(this, r, c, nr, nc); }
  setFrozenRows() { return this; }
  deleteRows(start, n) { this.data.splice(start - 1, n); }
  sortRows(rows, spec) {
    const specs = Array.isArray(spec) ? spec : [spec];
    rows.sort((a, b) => { for (const s of specs) { const c = s.column - 1, x = a[c], y = b[c]; if (x < y) return s.ascending === false ? 1 : -1; if (x > y) return s.ascending === false ? -1 : 1; } return 0; });
  }
}
class FakeBook {
  constructor(sheets = {}) { this.sheets = Object.fromEntries(Object.entries(sheets).map(([k, v]) => [k, new FakeSheet(k, v)])); }
  getSheetByName(n) { return this.sheets[n] || null; }
  insertSheet(n) { return (this.sheets[n] = new FakeSheet(n)); }
  getId() { return "sheet-test-id"; }
  getUrl() { return "https://docs.google.com/spreadsheets/d/sheet-test-id"; }
}
export class FakeEvent {
  constructor(id, start, end, title, description = "", location = "") { Object.assign(this, { id, start, end, title, description, location }); }
  getId() { return this.id; } getStartTime() { return this.start; } getEndTime() { return this.end; }
  getTitle() { return this.title; } setTitle(t) { this.title = t; } getDescription() { return this.description; }
  setDescription(d) { this.description = d; } getLocation() { return this.location; } isAllDayEvent() { return false; }
}

export function loadGas(files, { props = {}, sheets = {}, events = [], fetch = () => ({ code: 200, body: "{}" }), mailQuota = 100, gmailThreads = [] } = {}) {
  const sent = { mail: [], fetch: [] };
  const store = { ...props };
  const book = new FakeBook(sheets);
  const ctx = {
    console: { log() {}, error() {}, warn() {} },
    Utilities: {
      formatDate: fmt,
      computeHmacSha256Signature: (v, k) => [...crypto.createHmac("sha256", k).update(v).digest()].map(b => (b > 127 ? b - 256 : b)),
      base64Encode: s => Buffer.from(String(s)).toString("base64"),
      getUuid: () => crypto.randomUUID()
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => store[k] ?? null, setProperty: (k, v) => { store[k] = v; } }) },
    MailApp: { getRemainingDailyQuota: () => mailQuota - sent.mail.length, sendEmail: (to, subject, body, opts) => sent.mail.push({ to, subject, body, opts }) },
    UrlFetchApp: {
      fetch: (url, opts = {}) => {
        sent.fetch.push({ url, opts });
        const r = fetch(url, opts) || {};
        return { getResponseCode: () => r.code ?? 200, getContentText: () => typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {}) };
      }
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => book, openById: () => book, newDataValidation: () => { const b = { requireValueInList: () => b, requireCheckbox: () => b, build: () => ({}) }; return b; } },
    CalendarApp: (() => {
      const cal = { getEvents: (a, b) => events.filter(e => e.start < b && e.end > a), getEventById: id => events.find(e => e.id === id) || null };
      return { getDefaultCalendar: () => cal, getCalendarById: () => cal };
    })(),
    GmailApp: {
      search: q => { sent.lastQuery = q; return gmailThreads.filter(t => !t.labels.includes("__done")); },
      getUserLabelByName: n => ({ name: n }),
      createLabel: n => ({ name: n })
    },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => { const t = { timeBased: () => t, everyHours: () => t, everyMinutes: () => t, atHour: () => t, everyDays: () => t, forSpreadsheet: () => t, onEdit: () => t, onFormSubmit: () => t, create: () => t }; return t; } },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    HtmlService: { createHtmlOutput: html => ({ html, setTitle() { return this; } }) },
    ContentService: { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: "json" } },
    Session: { getScriptTimeZone: () => "Europe/Berlin" },
    FormApp: (() => {
      const forms = {};
      const item = (type, f) => { const it = { type, title: "", required: false, choices: null, help: "" };
        Object.assign(it, { setTitle: t => (it.title = t, it), setRequired: r => (it.required = r, it), setChoiceValues: c => (it.choices = c, it), setHelpText: h => (it.help = h, it) });
        f.items.push(it); return it; };
      return {
        DestinationType: { SPREADSHEET: "SPREADSHEET" },
        create: title => { const id = "form" + (Object.keys(forms).length + 1); const f = { id, title, items: [], dest: null };
          Object.assign(f, { getId: () => id, getPublishedUrl: () => "https://docs.google.com/forms/d/e/" + id + "/viewform",
            addMultipleChoiceItem: () => item("choice", f), addTextItem: () => item("text", f), addParagraphTextItem: () => item("paragraph", f),
            setDestination: (t, sid) => { f.dest = [t, sid]; return f; } });
          return (forms[id] = f); },
        openById: id => { if (!forms[id]) throw new Error("no form"); return forms[id]; },
        __forms: forms
      };
    })()
  };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: path.basename(f) });
  ctx.__sent = sent; ctx.__book = book; ctx.__props = store; ctx.__events = events;
  return ctx;
}
