/* Small offline Google Apps Script shims, enough to run the kit's .gs files in node.
   No network: UrlFetchApp calls a handler given by the test. Same file in reports/, docs/, hiring/. */
import vm from "node:vm";
import fs from "node:fs";

/* Any method call returns the same object and is recorded. Used for builders we do not inspect deeply. */
export function chain(log, name, extra = {}) {
  const calls = [];
  const p = new Proxy(extra, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "calls") return calls;
      if (k === "then") return undefined;
      return (...args) => { calls.push([k, ...args]); log && log.push([name, k, ...args]); return p; };
    },
  });
  return p;
}

function a1(ref) {
  const m = String(ref).match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
  const col = (s) => [...s].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);
  const r1 = +m[2], c1 = col(m[1]);
  const r2 = m[4] ? +m[4] : r1, c2 = m[3] ? col(m[3]) : c1;
  return [r1, c1, r2 - r1 + 1, c2 - c1 + 1];
}

export class FakeSheet {
  constructor(name, ss) { this.name = name; this.data = []; this.ss = ss; this.formUrl = null; this.rules = []; this.checkboxes = []; this.notes = {}; }
  getName() { return this.name; }
  setName(n) { this.name = n; return this; }
  getSheetId() { return this.ss.sheets.indexOf(this) + 100; }
  getLastRow() { let n = this.data.length; while (n && this.data[n - 1].every((c) => c === "" || c === undefined || c === null)) n--; return n; }
  getLastColumn() { return this.data.reduce((a, r) => Math.max(a, r.length), 0); }
  appendRow(r) { this.data.splice(this.getLastRow(), 0, r.slice()); return this; }
  setFrozenRows() { return this; }
  setColumnWidth() { return this; }
  autoResizeColumns() { return this; }
  hideSheet() { return this; }
  clear() { this.data = []; return this; }
  deleteRow(r) { this.data.splice(r - 1, 1); return this; }
  getFormUrl() { return this.formUrl; }
  setConditionalFormatRules(r) { this.rules = r; return this; }
  getConditionalFormatRules() { return this.rules; }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(r, c, nr = 1, nc = 1) {
    if (typeof r === "string") [r, c, nr, nc] = a1(r);
    const sh = this;
    const range = {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const row = sh.data[r - 1 + i] || []; const v = row[c - 1 + j]; return v === undefined ? "" : v; })),
      getValue: () => range.getValues()[0][0],
      setValues: (vals) => {
        if (vals.length !== nr || vals.some((x) => x.length !== nc)) throw new Error(`setValues size ${vals.length}x${vals[0] && vals[0].length} != ${nr}x${nc}`);
        vals.forEach((row, i) => { const R = r - 1 + i; while (sh.data.length <= R) sh.data.push([]); row.forEach((v, j) => { sh.data[R][c - 1 + j] = v; }); });
        for (const row of sh.data) for (let k = 0; k < row.length; k++) if (row[k] === undefined) row[k] = "";
        return range;
      },
      setValue: (v) => range.setValues([[v]]),
      setFormula: (f) => range.setValues([[f]]),
      setFormulas: (f) => range.setValues(f),
      insertCheckboxes: () => { sh.checkboxes.push([r, c, nr, nc]); return range; },
      setNumberFormat: () => range, setFontWeight: () => range, setBackground: () => range, setWrap: () => range,
      setNote: (n) => { sh.notes[`${r},${c}`] = n; return range; },
      setDataValidation: () => range,
      getRow: () => r, getColumn: () => c, getSheet: () => sh,
      getA1Notation: () => `R${r}C${c}`,
    };
    return range;
  }
}

export class FakeSpreadsheet {
  constructor(id = "SHEET_ID") { this.id = id; this.sheets = [new FakeSheet("Sheet1", this)]; }
  getId() { return this.id; }
  getUrl() { return `https://docs.google.com/spreadsheets/d/${this.id}/edit`; }
  getSheets() { return this.sheets.slice(); }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { const s = new FakeSheet(n || `Sheet${this.sheets.length + 1}`, this); this.sheets.push(s); return s; }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
}

/* Google Form fake: keeps items; setDestination creates the responses sheet like Google does. */
export function makeFormApp(log, ssRef) {
  const forms = [];
  const FormApp = {
    DestinationType: { SPREADSHEET: "SPREADSHEET" },
    PageNavigationType: { SUBMIT: "SUBMIT", CONTINUE: "CONTINUE" },
    createTextValidation: () => chain(log.calls, "validation", { build: () => ({ validation: true }) }),
    create(title) {
      const id = `FORM_${forms.length + 1}`;
      const items = [];
      const answerTypes = new Set(["Text", "ParagraphText", "List", "MultipleChoice", "Checkbox", "Date", "Time", "Scale"]);
      const addItem = (type) => () => {
        const it = { type, title: "", required: false, choices: [], help: "" };
        const obj = chain(log.calls, `item:${type}`, {
          setTitle: (t) => { it.title = t; return obj; },
          setHelpText: (t) => { it.help = t; return obj; },
          setRequired: (b) => { it.required = b; return obj; },
          setChoiceValues: (v) => { it.choices = v.slice(); return obj; },
          createChoice: (v, nav) => ({ value: v, nav }),
          setChoices: (cs) => { it.choices = cs.map((c) => c.value); it.nav = cs.map((c) => c.nav); return obj; },
          getTitle: () => it.title,
        });
        it.obj = obj;
        items.push(it);
        return obj;
      };
      const responses = [];
      const form = chain(log.calls, "form", {
        title, items, responses,
        published: false, requireLogin: true,
        isPublished: () => form.published,
        setPublished: (b) => { form.published = b; return form; },
        setRequireLogin: (b) => { form.requireLogin = b; return form; },
        getResponses: () => responses.slice(),
        deleteResponse: (rid) => { const k = responses.findIndex((r) => r.getId() === rid); if (k >= 0) responses.splice(k, 1); return form; },
        getId: () => id,
        getPublishedUrl: () => `https://docs.google.com/forms/d/e/${id}/viewform`,
        getEditUrl: () => `https://docs.google.com/forms/d/${id}/edit`,
        shortenFormUrl: (u) => u.replace("docs.google.com/forms/d/e/", "forms.gle/"),
        getItems: () => items.map((i) => i.obj),
        addTextItem: addItem("Text"), addParagraphTextItem: addItem("ParagraphText"), addListItem: addItem("List"),
        addMultipleChoiceItem: addItem("MultipleChoice"), addCheckboxItem: addItem("Checkbox"), addDateItem: addItem("Date"),
        addTimeItem: addItem("Time"), addScaleItem: addItem("Scale"), addPageBreakItem: addItem("PageBreak"),
        addSectionHeaderItem: addItem("SectionHeader"), addFileUploadItem: () => { throw new Error("FormApp cannot create file upload items"); },
        setDestination: (type, sheetId) => {
          const target = (ssRef.byId && ssRef.byId[sheetId]) || ssRef.main;
          const s = target.insertSheet("Form Responses 1");
          s.formUrl = `https://docs.google.com/forms/d/${id}/edit`;
          s.appendRow(["Timestamp", ...items.filter((i) => answerTypes.has(i.type)).map((i) => i.title)]);
          log.calls.push(["form", "setDestination", type, sheetId]);
          return form;
        },
      });
      forms.push(form);
      return form;
    },
    openById: (id) => forms.find((f) => f.getId() === id),
    getActiveForm: () => forms[forms.length - 1],
  };
  return { FormApp, forms };
}

export function loadGas(files, opts = {}) {
  const { props = {}, fetch = () => ({ code: 200, body: "{}" }), ss = new FakeSpreadsheet(), drive = {}, gmail = [], extra = {} } = opts;
  const store = { ...props };
  const log = { mail: [], fetch: [], triggers: [], calls: [] };
  const sheetsById = { [ss.getId()]: ss };
  const { FormApp, forms } = makeFormApp(log, { main: ss, byId: sheetsById });
  const ctx = {
    console,
    CONFIG: opts.config,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in store ? store[k] : null),
      setProperty: (k, v) => { store[k] = String(v); },
      deleteProperty: (k) => { delete store[k]; },
      getProperties: () => ({ ...store }),
    }) },
    UrlFetchApp: { fetch: (url, o = {}) => {
      log.fetch.push({ url, opts: o });
      const r = fetch(url, o) || {};
      return { getResponseCode: () => r.code ?? 200, getContentText: () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {})), getBlob: () => ({ bytes: r.body }) };
    } },
    MailApp: { sendEmail: (...a) => { const m = typeof a[0] === "object" ? a[0] : { to: a[0], subject: a[1], body: a[2], ...(a[3] || {}) }; log.mail.push(m); }, getRemainingDailyQuota: () => 100 },
    ScriptApp: {
      WeekDay: { MONDAY: "MONDAY" },
      getOAuthToken: () => "fake-oauth-token",
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: (fn) => { const t = { fn, calls: [] }; const c = chain(t.calls, "trigger", { create: () => { log.triggers.push(t); return t; } }); return c; },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      openById: (id) => sheetsById[id] || ss,
      create: (name) => { const n = new FakeSpreadsheet(`SHEET_${Object.keys(sheetsById).length + 1}`); n.name = name; sheetsById[n.getId()] = n; return n; },
      flush: () => {},
      newConditionalFormatRule: () => chain(log.calls, "cfrule", { build: () => ({ rule: true }) }),
      newDataValidation: () => chain(log.calls, "dv", { build: () => ({ dv: true }) }),
    },
    FormApp,
    DriveApp: {
      getFolderById: (id) => {
        const files = (drive[id] || []).slice();
        let i = 0;
        return { getFiles: () => ({ hasNext: () => i < files.length, next: () => files[i++] }), createFile: (b) => { const f = fakeFile(b.name || "file", b); (drive[id] = drive[id] || []).push(f); return f; }, getId: () => id, getName: () => `Folder ${id}` };
      },
      getFileById: (id) => Object.values(drive).flat().find((f) => f.getId() === id),
      getRootFolder: () => ctx.DriveApp.getFolderById("root"),
    },
    GmailApp: { search: () => gmail },
    Utilities: {
      formatDate: (d, tz, f) => d.toISOString().slice(0, 10),
      newBlob: (data, type, name) => ({ data, type, name, getDataAsString: () => String(data), getName: () => name, setName(n) { this.name = n; return this; } }),
      sleep: () => {},
    },
    Session: { getScriptTimeZone: () => "Europe/Berlin" },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ...extra,
  };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
  return { ctx, store, log, ss, forms, sheetsById };
}

let fileCounter = 0;
export function fakeFile(name, content, updated = new Date("2026-11-26T03:00:00Z")) {
  const id = `FILE_${++fileCounter}`;
  return {
    getId: () => id, getName: () => name, getLastUpdated: () => updated, getUrl: () => `https://drive.google.com/file/d/${id}/view`,
    getBlob: () => ({ getDataAsString: () => (typeof content === "string" ? content : content.data) }),
    content,
    setTrashed: () => {},
  };
}
