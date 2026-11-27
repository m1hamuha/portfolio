/* Fake DocumentApp + DriveApp for the docs kit, and a tiny evaluator for the sheet formulas the kit writes
   (IF, ROUND, MAX, N, SUM, SUMIF, + - * /, comparisons), so tests can prove the phone total equals the PDF total. */

export function makeDocsWorld() {
  const docs = {}, files = {}, folders = {};
  let n = 0;
  const body = (els = []) => {
    const b = {
      els,
      appendParagraph: (t) => { const p = { kind: "p", text: t }; els.push(p); return { setHeading: (h) => { p.heading = h; return p; } }; },
      appendTable: (cells) => { const t = { kind: "table", rows: cells.map((r) => r.slice()) }; els.push(t); return t; },
      getTables: () => els.filter((e) => e.kind === "table").map(tableObj),
      replaceText: (re, rep) => {
        const rx = new RegExp(re, "g");
        for (const e of els) {
          if (e.kind === "p") e.text = e.text.replace(rx, () => rep);
          else e.rows = e.rows.map((r) => r.map((c) => c.replace(rx, () => rep)));
        }
      },
      text: () => els.map((e) => (e.kind === "p" ? e.text : e.rows.map((r) => r.join(" | ")).join("\n"))).join("\n"),
    };
    return b;
  };
  const tableObj = (t) => ({
    getNumRows: () => t.rows.length,
    removeRow: (i) => { t.rows.splice(i, 1); },
    getRow: (i) => ({ getCell: (j) => ({ setText: (s) => { t.rows[i][j] = s; } }) }),
    appendTableRow: () => { const r = []; t.rows.push(r); return { appendTableCell: (s) => { r.push(s); } }; },
  });
  const fileFor = (id, name, folderId) => {
    const f = {
      id, name, folderId, trashed: false,
      getId: () => id, getName: () => f.name, getUrl: () => `https://drive.google.com/file/d/${id}/view`,
      makeCopy: (nm, folder) => {
        const nid = `DOC_${++n}`;
        docs[nid] = { id: nid, name: nm, body: body(JSON.parse(JSON.stringify(docs[id].body.els))) };
        return (files[nid] = fileFor(nid, nm, folder.getId()));
      },
      getAs: (mime) => ({ mime, data: docs[id].body.text(), name: f.name, setName(x) { this.name = x; return this; } }),
      getBlob: () => f.blob,
      setTrashed: (b) => { f.trashed = b; },
    };
    return f;
  };
  const folderObj = (fid) => ({
    getId: () => fid,
    createFile: (blob) => { const id = `PDF_${++n}`; const f = fileFor(id, blob.name, fid); f.blob = blob; files[id] = f; (folders[fid] = folders[fid] || []).push(f); return f; },
    getFiles: () => { const l = folders[fid] || []; let i = 0; return { hasNext: () => i < l.length, next: () => l[i++] }; },
  });
  const DocumentApp = {
    ParagraphHeading: { HEADING1: "H1", HEADING2: "H2" },
    create: (name) => { const id = `DOC_${++n}`; docs[id] = { id, name, body: body() }; files[id] = fileFor(id, name, "root"); return { getId: () => id, getBody: () => docs[id].body, saveAndClose: () => {} }; },
    openById: (id) => ({ getId: () => id, getBody: () => docs[id].body, saveAndClose: () => {} }),
  };
  const DriveApp = {
    createFolder: (name) => { const fid = `FOLDER_${++n}`; folders[fid] = []; return folderObj(fid); },
    getFolderById: (fid) => folderObj(fid),
    getFileById: (id) => files[id],
    getRootFolder: () => folderObj("root"),
  };
  return { DocumentApp, DriveApp, docs, files, folders };
}

/* ---------- formula evaluator ---------- */
const colNum = (s) => [...s].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);

export function evalCell(sheet, ref) {
  const m = ref.replace(/\$/g, "").match(/^([A-Z]+)(\d+)$/);
  const v = (sheet.data[+m[2] - 1] || [])[colNum(m[1]) - 1];
  if (typeof v === "string" && v.startsWith("=")) return evalFormula(sheet, v.slice(1));
  return v === undefined ? "" : v;
}

export function evalFormula(sheet, src) {
  const toks = src.match(/"[^"]*"|\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?|[A-Z]+(?=\()|TRUE|FALSE|\d+(?:\.\d+)?|>=|<=|<>|[-+*/(),=<>]/g);
  let i = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const N = (v) => (typeof v === "number" ? v : v === true ? 1 : 0);
  const range = (r) => {
    const [a, b] = r.replace(/\$/g, "").split(":");
    const ma = a.match(/([A-Z]+)(\d+)/), mb = b.match(/([A-Z]+)(\d+)/);
    const out = [];
    for (let row = +ma[2]; row <= +mb[2]; row++) for (let c = colNum(ma[1]); c <= colNum(mb[1]); c++) out.push(evalCell(sheet, String.fromCharCode(64 + c) + row));
    return out;
  };
  const fns = {
    IF: (a) => (a[0]() ? a[1]() : a[2] ? a[2]() : false),
    ROUND: (a) => { const f = 10 ** a[1](); return Math.round((N(a[0]()) + Number.EPSILON) * f) / f; },
    MAX: (a) => Math.max(...a.map((x) => N(x()))),
    N: (a) => N(a[0]()),
    SUM: (a) => a.map((x) => x()).flat().reduce((s, v) => s + (typeof v === "number" ? v : 0), 0),
    SUMIF: (a) => { const r = a[0](), crit = a[1](), s = a[2](); return r.reduce((acc, v, k) => acc + (v === crit && typeof s[k] === "number" ? s[k] : 0), 0); },
  };
  function primary() {
    const t = next();
    if (t === "(") { const v = cmp(); next(); return v; }
    if (t === "-") return -N(primary());
    if (t === "TRUE") return true;
    if (t === "FALSE") return false;
    if (/^"/.test(t)) return t.slice(1, -1);
    if (/^\d/.test(t)) return parseFloat(t);
    if (fns[t]) {
      next(); // (
      const args = [];
      while (peek() !== ")") {
        const start = i; let depth = 0;
        while (!(depth === 0 && (peek() === "," || peek() === ")"))) { const x = next(); if (x === "(") depth++; if (x === ")") depth--; }
        const sub = toks.slice(start, i);
        args.push(() => { const save = [i]; const v = subEval(sub); i = save[0]; return v; });
        if (peek() === ",") next();
      }
      next();
      return fns[t](args);
    }
    if (t.includes(":")) return range(t);
    return evalCell(sheet, t);
  }
  function subEval(sub) { const keep = { toks: toks.slice(), i }; toks.length = 0; toks.push(...sub); i = 0; const v = cmp(); toks.length = 0; toks.push(...keep.toks); i = keep.i; return v; }
  function term() { let v = primary(); while (peek() === "*" || peek() === "/") { const op = next(); const w = primary(); v = op === "*" ? N(v) * N(w) : N(v) / N(w); } return v; }
  function sum() { let v = term(); while (peek() === "+" || peek() === "-") { const op = next(); const w = term(); v = op === "+" ? N(v) + N(w) : N(v) - N(w); } return v; }
  function cmp() {
    let v = sum();
    while ([">=", "<=", "<>", "=", "<", ">"].includes(peek())) {
      const op = next(); const w = sum();
      v = op === "=" ? v === w : op === "<>" ? v !== w : op === ">=" ? N(v) >= N(w) : op === "<=" ? N(v) <= N(w) : op === ">" ? N(v) > N(w) : N(v) < N(w);
    }
    return v;
  }
  return cmp();
}
