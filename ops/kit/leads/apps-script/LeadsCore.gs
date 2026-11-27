/**
 * Leads kit, pure logic (testable in node). One row per request in the sheet "Leads".
 * Columns (fixed order): Done | # | Next step | Received | Channel | Name | Contact | What | When | Open | Stage | Stage date | Key
 */
var L_DAY = 24 * 60 * 60 * 1000;
var L_COL = { done: 0, rank: 1, next: 2, received: 3, channel: 4, name: 5, contact: 6, what: 7, when: 8, open: 9, stage: 10, stageDate: 11, key: 12 };

var L_DEFAULTS = {
  timezone: "Europe/Berlin", countryCode: "49", sheet: "Leads",
  email: { enabled: true, query: "", label: "Leads", formSenders: [], maxThreads: 25 },
  notify: { telegramChatIds: [], email: "", detail: "full" },
  followUpDays: 5, retentionDays: 365, health: false,
  llm: { enabled: false, provider: "anthropic", model: "claude-haiku-5-5" }
};

var L_HEAD = {
  ru: ["Готово", "#", "Что сделать", "Пришла", "Откуда", "Имя", "Контакт", "Что нужно", "Когда", "Открыть", "Этап", "Дата этапа", "Ключ"],
  uk: ["Готово", "#", "Що зробити", "Прийшла", "Звідки", "Імʼя", "Контакт", "Що потрібно", "Коли", "Відкрити", "Етап", "Дата етапу", "Ключ"],
  de: ["Erledigt", "#", "Nächster Schritt", "Eingang", "Kanal", "Name", "Kontakt", "Anliegen", "Wann", "Öffnen", "Stand", "Datum Stand", "Schlüssel"],
  en: ["Done", "#", "Next step", "Received", "Channel", "Name", "Contact", "What", "When", "Open", "Stage", "Stage date", "Key"]
};
var L_STAGES = {
  ru: ["новая", "ответил", "смета отправлена", "договорились", "отказ"],
  uk: ["нова", "відповів", "кошторис надіслано", "домовились", "відмова"],
  de: ["neu", "geantwortet", "Angebot gesendet", "zugesagt", "abgesagt"],
  en: ["new", "replied", "quote sent", "won", "lost"]
};
var L_CHANNELS = {
  ru: { email: "почта", site: "сайт", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", phone: "телефон" },
  uk: { email: "пошта", site: "сайт", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", phone: "телефон" },
  de: { email: "E-Mail", site: "Website", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", phone: "Telefon" },
  en: { email: "email", site: "website", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook", telegram: "Telegram", phone: "phone" }
};
var L_TEXT = {
  waiting: { ru: "без ответа с {since}", uk: "без відповіді з {since}", de: "unbeantwortet seit {since}", en: "unanswered since {since}" },
  followup: { ru: "смета отправлена {days} дн. назад, перезвонить", uk: "кошторис надіслано {days} дн. тому, передзвонити", de: "Angebot vor {days} Tagen gesendet, nachfassen", en: "quote sent {days} days ago, call again" },
  quoteWait: { ru: "ждём ответа на смету", uk: "чекаємо відповіді на кошторис", de: "wartet auf Antwort zum Angebot", en: "waiting for reply to quote" },
  newLead: { ru: "Новая заявка", uk: "Нова заявка", de: "Neue Anfrage", en: "New request" },
  openList: { ru: "Открыть список", uk: "Відкрити список", de: "Liste öffnen", en: "Open the list" },
  digest: { ru: "Без ответа: {n}. Перезвонить: {f}.", uk: "Без відповіді: {n}. Передзвонити: {f}.", de: "Unbeantwortet: {n}. Nachfassen: {f}.", en: "Unanswered: {n}. Call again: {f}." },
  today: { ru: "сегодня", uk: "сьогодні", de: "heute", en: "today" }
};
var L_WD = {
  ru: ["понедельника", "вторника", "среды", "четверга", "пятницы", "субботы", "воскресенья"],
  uk: ["понеділка", "вівторка", "середи", "четверга", "пʼятниці", "суботи", "неділі"],
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};

function lMerge_(a, b) {
  if (b === undefined || b === null) return a;
  if (typeof a !== "object" || a === null || Array.isArray(a) || typeof b !== "object" || Array.isArray(b)) return b;
  var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b).forEach(function (k) { o[k] = lMerge_(a[k], b[k]); }); return o;
}
function parseLeadsConfig(json) {
  var cfg = lMerge_(L_DEFAULTS, typeof json === "string" ? JSON.parse(json) : (json || {}));
  if (!cfg.business || !cfg.business.name) throw new Error("config: business.name is required");
  cfg.lang = ["ru", "uk", "de", "en"].indexOf(cfg.business.lang) >= 0 ? cfg.business.lang : "de";
  if (cfg.health) { cfg.notify.detail = "minimal"; cfg.llm.enabled = false; } // clinics: no message content leaves Google
  return cfg;
}
function lFill(t, v) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? String(v[k]) : ""; }); }
function lText(k, lang) { return L_TEXT[k][lang] || L_TEXT[k].en; }

function lNormPhone(raw, cc) {
  var s = String(raw || "").replace(/[^\d+]/g, "");
  if (!s) return "";
  if (s.charAt(0) === "+") s = s.slice(1); else if (s.slice(0, 2) === "00") s = s.slice(2); else if (s.charAt(0) === "0") s = cc + s.slice(1);
  s = s.replace(/\D/g, "");
  return s.length >= 8 && s.length <= 15 ? s : "";
}
function lClean(s, max) {
  return String(s || "").replace(/\r/g, "").replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim().slice(0, max || 300);
}

/* ---------- e-mail parsing ---------- */

var L_FIELDS = {
  name: ["name", "your-name", "vorname", "nachname", "vor- und nachname", "ihr name", "имя", "ім'я", "імʼя", "full name"],
  phone: ["telefon", "telefonnummer", "phone", "tel", "mobil", "handy", "телефон", "номер", "your-phone"],
  email: ["e-mail", "email", "mail", "your-email", "почта", "пошта", "e-mail-adresse"],
  what: ["nachricht", "message", "anliegen", "ihre nachricht", "your-message", "leistung", "service", "betreff", "subject", "сообщение", "повідомлення", "что нужно", "що потрібно", "anfrage"],
  when: ["wunschtermin", "termin", "datum", "date", "wunschtag", "wann", "когда", "коли", "день", "preferred date"]
};
function fieldOf_(label) {
  var t = String(label).trim().toLowerCase().replace(/[*:]+$/, "").trim();
  for (var k in L_FIELDS) if (L_FIELDS[k].indexOf(t) >= 0) return k;
  return "";
}
/* "Name: Anna" or "Name\nAnna" lines from typical site-form notification e-mails (WordPress CF7, Wix, Jimdo, ...) */
function parseFormBody(body) {
  var lines = String(body || "").replace(/\r/g, "").split("\n"), out = {}, cur = "";
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) { cur = ""; continue; }
    var m = line.match(/^([^:]{2,40}):\s*(.*)$/);
    var f = m ? fieldOf_(m[1]) : fieldOf_(line);
    if (m && f) { cur = f; if (m[2]) out[f] = (out[f] ? out[f] + " " : "") + m[2]; continue; }
    if (!m && f && !out[f]) { cur = f; continue; }
    if (cur && (cur === "what" || !out[cur])) out[cur] = (out[cur] ? out[cur] + " " : "") + line;
  }
  return out;
}
function stripQuoted(body) {
  var lines = String(body || "").replace(/\r/g, "").split("\n"), out = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (/^>/.test(l)) continue;
    if (/^(On .* wrote:|Am .* schrieb .*:|-----Original|-- $|Von: |From: )/.test(l.trim())) break;
    out.push(l);
  }
  return out.join("\n");
}
function parseFrom(from) {
  var m = String(from || "").match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: String(from || "").trim().toLowerCase() };
}
/* one Gmail message -> lead or null. msg: {id, threadId, from, subject, body, date} */
function emailToLead(msg, cfg) {
  var from = parseFrom(msg.from);
  var isForm = (cfg.email.formSenders || []).some(function (s) { return from.email.indexOf(String(s).toLowerCase()) >= 0; });
  var lead;
  if (isForm) {
    var f = parseFormBody(msg.body);
    var phone = lNormPhone(f.phone, cfg.countryCode);
    lead = { channel: "site", name: lClean(f.name, 60), contact: phone ? "+" + phone : lClean(f.email || "", 80), what: lClean(f.what || msg.subject, 300), when: lClean(f.when, 60) };
    lead.open = phone ? "https://wa.me/" + phone : (f.email ? "mailto:" + f.email : "");
    lead.externalId = "gm:" + msg.id;
  } else {
    var body = lClean(stripQuoted(msg.body), 300);
    var ph = (body.match(/(?:\+|00)?\d[\d \-\/()]{6,18}\d/) || [""])[0];
    lead = { channel: "email", name: from.name || from.email.split("@")[0], contact: from.email + (lNormPhone(ph, cfg.countryCode) ? ", +" + lNormPhone(ph, cfg.countryCode) : ""), what: lClean((msg.subject ? msg.subject + ". " : "") + body, 300), when: "" };
    lead.open = "https://mail.google.com/mail/u/0/#all/" + msg.threadId;
    lead.externalId = from.email;
  }
  lead.received = msg.date;
  return lead;
}

/* ---------- rows ---------- */

function leadKey(lead) { return lead.channel + ":" + String(lead.externalId || lead.contact || lead.name).toLowerCase(); }
function stageIndex(label, lang) {
  var s = String(label || "").trim().toLowerCase();
  for (var l in L_STAGES) { var i = L_STAGES[l].map(function (x) { return x.toLowerCase(); }).indexOf(s); if (i >= 0) return i; }
  return 0;
}
function lDateStr(d, tz) { return Utilities.formatDate(d, tz, "yyyy-MM-dd"); }
function lDays(a, b, tz) {
  var x = lDateStr(a, tz).split("-"), y = lDateStr(b, tz).split("-");
  return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / L_DAY);
}
function sinceText(received, now, cfg) {
  var tz = cfg.timezone, lang = cfg.lang;
  var d = lDays(received, now, tz);
  if (d <= 0) return lText("today", lang) + " " + Utilities.formatDate(received, tz, "HH:mm");
  if (d < 7) return L_WD[lang][parseInt(Utilities.formatDate(received, tz, "u"), 10) - 1];
  return Utilities.formatDate(received, tz, "dd.MM.");
}
/* rank 1 = top. Returns {rank, next} */
function computeNext(row, now, cfg) {
  var lang = cfg.lang;
  if (row[L_COL.done] === true || String(row[L_COL.done]).toUpperCase() === "TRUE") return { rank: 9, next: "" };
  var st = stageIndex(row[L_COL.stage], lang);
  var rec = row[L_COL.received] instanceof Date || Object.prototype.toString.call(row[L_COL.received]) === "[object Date]" ? row[L_COL.received] : new Date(row[L_COL.received] || now);
  if (st === 0) return { rank: 1, next: lFill(lText("waiting", lang), { since: sinceText(rec, now, cfg) }) };
  if (st === 2) {
    var sd = row[L_COL.stageDate] ? new Date(row[L_COL.stageDate]) : rec;
    var days = lDays(sd, now, cfg.timezone);
    if (days >= cfg.followUpDays) return { rank: 2, next: lFill(lText("followup", lang), { days: days }) };
    return { rank: 6, next: lText("quoteWait", lang) };
  }
  if (st >= 3) return { rank: 9, next: "" };
  return { rank: 5, next: "" };
}
function newRow(lead, now, cfg) {
  var row = [false, 1, "", lead.received || now, (L_CHANNELS[cfg.lang] || L_CHANNELS.en)[lead.channel] || lead.channel, lead.name || "", lead.contact || "", lead.what || "", lead.when || "", lead.open || "", L_STAGES[cfg.lang][0], "", leadKey(lead)];
  var n = computeNext(row, now, cfg); row[L_COL.rank] = n.rank; row[L_COL.next] = n.next;
  return row;
}
/* rows: data rows without header. Returns {action:"append"|"update", index, row} */
function planUpsert(rows, lead, now, cfg) {
  var key = leadKey(lead);
  for (var i = rows.length - 1; i >= 0; i--) {
    if (rows[i][L_COL.key] !== key) continue;
    var age = now.getTime() - new Date(rows[i][L_COL.received]).getTime();
    if (age > 14 * L_DAY) break;
    var r = rows[i].slice();
    if (lead.what && String(r[L_COL.what]).indexOf(lead.what) < 0) r[L_COL.what] = lClean(lead.what + " | " + r[L_COL.what], 300);
    var wasDone = r[L_COL.done] === true || String(r[L_COL.done]).toUpperCase() === "TRUE";
    if (wasDone && stageIndex(r[L_COL.stage]) < 3) { r[L_COL.done] = false; r[L_COL.stage] = L_STAGES[cfg.lang][0]; r[L_COL.received] = lead.received || now; }
    var n = computeNext(r, now, cfg); r[L_COL.rank] = n.rank; r[L_COL.next] = n.next;
    return { action: "update", index: i, row: r, reopened: wasDone };
  }
  return { action: "append", row: newRow(lead, now, cfg) };
}
function sortRows(rows) {
  return rows.slice().sort(function (a, b) {
    if (a[L_COL.rank] !== b[L_COL.rank]) return a[L_COL.rank] - b[L_COL.rank];
    return new Date(b[L_COL.received]).getTime() - new Date(a[L_COL.received]).getTime();
  });
}
function notifyText(lead, cfg, sheetUrl) {
  var lang = cfg.lang, ch = (L_CHANNELS[lang] || L_CHANNELS.en)[lead.channel] || lead.channel;
  if (cfg.notify.detail === "minimal") return lText("newLead", lang) + " (" + ch + "). " + lText("openList", lang) + ": " + sheetUrl;
  return lText("newLead", lang) + " (" + ch + "): " + [lead.name, lead.what, lead.when, lead.contact].filter(String).join(", ").slice(0, 600) + "\n" + sheetUrl;
}
function digestText(rows, cfg) {
  var n = 0, f = 0;
  rows.forEach(function (r) { if (r[L_COL.rank] === 1) n++; if (r[L_COL.rank] === 2) f++; });
  return { n: n, f: f, text: lFill(lText("digest", cfg.lang), { n: n, f: f }) };
}

/* ---------- optional LLM: is this e-mail a request, and a 1-line "what" ----------
 * Provider is swappable: add a function to LLM_PROVIDERS with the same signature. */
var LLM_PROMPT = "You read one e-mail sent to a small business. Decide if it is a customer request (someone wants a service, a price, an appointment). Ignore newsletters, invoices, spam, notifications. Answer ONLY JSON: {\"lead\": true|false, \"what\": \"max 8 words in LANG, what the person wants\"}.";
var LLM_PROVIDERS = {
  anthropic: function (text, cfg, fetchFn, key) {
    var r = fetchFn("https://api.anthropic.com/v1/messages", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      payload: JSON.stringify({ model: cfg.llm.model, max_tokens: 300, thinking: { type: "disabled" }, system: LLM_PROMPT.replace("LANG", cfg.lang), messages: [{ role: "user", content: String(text).slice(0, 3000) }] })
    });
    if (r.getResponseCode() !== 200) return null;
    var j = JSON.parse(r.getContentText());
    return (j.content || []).map(function (c) { return c.text || ""; }).join("");
  }
};
function llmJudge(text, cfg, fetchFn, key) {
  if (!cfg.llm.enabled || cfg.health || !key) return null;
  try {
    var out = LLM_PROVIDERS[cfg.llm.provider](text, cfg, fetchFn, key);
    var m = String(out || "").match(/\{[\s\S]*\}/);
    if (!m) return null;
    var j = JSON.parse(m[0]);
    return { lead: j.lead === true, what: lClean(j.what, 80) };
  } catch (e) { return null; }
}
