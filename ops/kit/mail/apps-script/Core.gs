/**
 * Pure logic of the reminder kit. No Google services are called here directly except
 * Utilities.formatDate and Utilities.computeHmacSha256Signature (shimmed in node tests).
 * Everything that touches Calendar, Sheets, Gmail or HTTP goes through the "io" object
 * built in Main.gs, so the whole decision logic runs offline in tests.
 */

var DAY_MS = 24 * 60 * 60 * 1000;

var DEFAULTS = {
  timezone: "Europe/Berlin",
  defaultLang: "de",
  countryCode: "49",
  source: { type: "calendar", calendarId: "primary", lookbackDays: 130 },
  reminders: { enabled: true, when: "day_before", kind: "reminder_day_before", sendHour: 17, untilHour: 21, channels: ["whatsapp"], requireConsent: true, minLeadMinutes: 60 },
  comeback: { enabled: false, kind: "comeback", afterDays: 60, maxDays: 120, sendHour: 11, channels: ["whatsapp"], requireMarketingConsent: true, source: "history", perRun: 40 },
  documents: { enabled: false, sheet: "Docs", everyDays: 7, maxCount: 3, sendHour: 9, perRun: 60 },
  whatsapp: { mode: "assist", provider: "meta", graphVersion: "v24.0", langCodes: { ru: "ru", uk: "uk", de: "de", en: "en" }, templates: {} },
  sms: { provider: "seven", from: "" },
  move: { days: 6, starts: ["08:00", "10:00", "13:00", "15:00"], durationMin: 120, workdays: [1, 2, 3, 4, 5] },
  texts: {}
};

function mergeDeep_(base, over) {
  if (over === undefined || over === null) return base;
  if (typeof base !== "object" || base === null || Array.isArray(base) || typeof over !== "object" || Array.isArray(over)) return over;
  var out = {};
  Object.keys(base).forEach(function (k) { out[k] = base[k]; });
  Object.keys(over).forEach(function (k) { out[k] = mergeDeep_(base[k], over[k]); });
  return out;
}

function parseConfig(json) {
  var raw = typeof json === "string" ? JSON.parse(json) : json;
  var cfg = mergeDeep_(DEFAULTS, raw || {});
  if (!cfg.business || !cfg.business.name) throw new Error("config: business.name is required");
  if (!cfg.business.ownerEmail) throw new Error("config: business.ownerEmail is required (where alerts and digests go)");
  ["ru", "uk", "de", "en"].indexOf(cfg.defaultLang) < 0 && (cfg.defaultLang = "de");
  return cfg;
}

/* ---------- dates in the business time zone ---------- */

function localParts(date, tz) {
  var s = Utilities.formatDate(date, tz, "yyyy-MM-dd HH:mm u");
  return { date: s.slice(0, 10), time: s.slice(11, 16), hour: parseInt(s.slice(11, 13), 10), weekday: parseInt(s.slice(17), 10) };
}
function addDays(dateStr, n) {
  var p = dateStr.split("-");
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + n * DAY_MS);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  var pa = a.split("-"), pb = b.split("-");
  return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / DAY_MS);
}
function weekdayOf(dateStr) { // 1 = Monday ... 7 = Sunday
  var p = dateStr.split("-");
  var w = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
  return w === 0 ? 7 : w;
}
function tzOffsetMin(dateStr, tz) {
  var p = dateStr.split("-");
  var z = Utilities.formatDate(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)), tz, "Z"); // +0100
  var sign = z.charAt(0) === "-" ? -1 : 1;
  return sign * (parseInt(z.slice(1, 3), 10) * 60 + parseInt(z.slice(3, 5), 10));
}
function localToMs(dateStr, timeStr, tz) {
  var p = dateStr.split("-"), t = timeStr.split(":");
  return Date.UTC(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]) - tzOffsetMin(dateStr, tz) * 60000;
}
/* "2026-11-28", "28.11.2026", "28.11.26", a Date object -> "yyyy-MM-dd" */
function toDateStr(v, tz) {
  if (v === null || v === undefined || v === "") return "";
  if (Object.prototype.toString.call(v) === "[object Date]") return localParts(v, tz).date;
  var s = String(v).trim(), m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  if ((m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/))) {
    var y = m[3].length === 2 ? "20" + m[3] : m[3];
    return y + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  }
  return "";
}
/* "19:00", "19.00", "7 pm" is not supported on purpose, a Date (time cell) -> "HH:mm" */
function toTimeStr(v, tz) {
  if (v === null || v === undefined || v === "") return "";
  if (Object.prototype.toString.call(v) === "[object Date]") return localParts(v, tz).time;
  var m = String(v).trim().match(/^(\d{1,2})[:.](\d{2})/);
  return m ? ("0" + m[1]).slice(-2) + ":" + m[2] : "";
}

/* ---------- contacts ---------- */

function normalizePhone(raw, cc) {
  if (!raw) return "";
  var s = String(raw).replace(/[^\d+]/g, "");
  if (!s) return "";
  if (s.charAt(0) === "+") s = s.slice(1);
  else if (s.slice(0, 2) === "00") s = s.slice(2);
  else if (s.charAt(0) === "0") s = cc + s.slice(1);
  s = s.replace(/\D/g, "");
  return s.length >= 8 && s.length <= 15 ? s : "";
}
function extractContact(text, cc) {
  text = String(text || "");
  var out = { phone: "", email: "", lang: "", tags: {} };
  var em = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
  if (em) out.email = em[0].toLowerCase();
  var re = /(?:\+|00)?\d[\d \-\/()]{6,18}\d/g, m;
  while ((m = re.exec(text))) {
    var digits = m[0].replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15) { out.phone = normalizePhone(m[0], cc); if (out.phone) break; }
  }
  var tags = text.match(/#[a-zа-яіїєґ]+/gi) || [];
  tags.forEach(function (t) {
    t = t.slice(1).toLowerCase();
    out.tags[t] = true;
    if (["ru", "uk", "de", "en"].indexOf(t) >= 0) out.lang = t;
  });
  return out;
}
function contactKey(b) { return b.phone ? "p:" + b.phone : (b.email ? "e:" + b.email : ""); }
function truthy(v) { return v === true || /^(1|x|yes|ja|да|так|true|ok|✓)$/i.test(String(v || "").trim()); }
function firstName(s) { return String(s || "").trim().split(/\s+/)[0] || ""; }
function cleanName(title) {
  return String(title || "")
    .replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, " ")
    .replace(/(?:\+|00)?\d[\d \-\/()]{6,18}\d/g, " ")
    .replace(/#\S+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Normalizes one booking from any source to:
 * {id, date, time, startMs, name, phone, email, lang, wa, promo, stop, status}
 * raw: {id, startMs, title, text, name, phone, email, lang, consent, promo, status, date, time}
 * contacts: map "p:49151..." -> {lang, wa, promo, stop, name}
 */
function normalizeBooking(raw, cfg, contacts) {
  var tz = cfg.timezone, cc = cfg.countryCode;
  var c = extractContact((raw.title || "") + "\n" + (raw.text || ""), cc);
  var phone = normalizePhone(raw.phone, cc) || c.phone;
  var email = (raw.email ? String(raw.email).trim().toLowerCase() : "") || c.email;
  var date = raw.date || (raw.startMs ? localParts(new Date(raw.startMs), tz).date : "");
  var time = raw.time || (raw.startMs ? localParts(new Date(raw.startMs), tz).time : "");
  var startMs = raw.startMs || (date && time ? localToMs(date, time, tz) : 0);
  var b = { id: String(raw.id || ""), date: date, time: time, startMs: startMs, phone: phone, email: email };
  var known = (contacts && contacts[contactKey(b)]) || {};
  b.name = firstName(raw.name || cleanName(raw.title) || known.name);
  b.lang = raw.lang || c.lang || known.lang || cfg.defaultLang;
  if (["ru", "uk", "de", "en"].indexOf(b.lang) < 0) b.lang = cfg.defaultLang;
  b.wa = truthy(raw.consent) || !!c.tags.wa || truthy(known.wa);
  b.promo = truthy(raw.promo) || !!c.tags.promo || truthy(known.promo);
  b.stop = !!c.tags.stop || truthy(known.stop) || /^(cancel|storno|отмена|скасовано|abgesagt)/i.test(String(raw.status || ""));
  b.status = raw.status || "";
  if (!b.id) b.id = contactKey(b) + "@" + date + "T" + time;
  return b;
}

/* weekly timetable rows {weekday:"Mo"/1, time, name, phone...} -> bookings for one date */
var WD_NAMES = { 1: /^(1|mo|mon|пн|пон)/i, 2: /^(2|di|tu|вт|вів)/i, 3: /^(3|mi|we|ср|сер)/i, 4: /^(4|do|th|чт|чет)/i, 5: /^(5|fr|пт|п'ят|пʼят|пят)/i, 6: /^(6|sa|сб|суб)/i, 7: /^(7|so|su|вс|нд|нед|вос)/i };
function expandWeekly(rows, dateStr) {
  var wd = weekdayOf(dateStr);
  return rows.filter(function (r) { return WD_NAMES[wd].test(String(r.weekday || "").trim()); })
    .map(function (r) {
      var o = {}; Object.keys(r).forEach(function (k) { o[k] = r[k]; });
      o.date = dateStr; o.id = "w:" + (r.phone || r.email || r.name) + "@" + dateStr + "T" + r.time;
      return o;
    });
}

/* ---------- texts ---------- */

function fmtDate(dateStr, lang) {
  var p = dateStr.split("-");
  return lang === "en" ? MONTHS_EN[+p[1] - 1] + " " + (+p[2]) : p[2] + "." + p[1] + ".";
}
function fmtTime(timeStr, lang) {
  if (lang !== "en") return timeStr;
  var h = +timeStr.slice(0, 2), m = timeStr.slice(3);
  var ap = h >= 12 ? "pm" : "am", h12 = h % 12 || 12;
  return m === "00" ? h12 + " " + ap : h12 + ":" + m + " " + ap;
}
function textFor(kind, lang, cfg) {
  var o = (cfg.texts && cfg.texts[kind]) || {};
  var base = TEXTS[kind] || {};
  return o[lang] || base[lang] || o[cfg.defaultLang] || base[cfg.defaultLang] || base.en || "";
}
function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ""; });
}
function varsFor(b, cfg, extra) {
  var v = {
    name: b.name || "", business: cfg.business.name, phone: cfg.business.phone || "",
    date: b.date ? fmtDate(b.date, b.lang) : "", time: b.time ? fmtTime(b.time, b.lang) : "",
    weekday: b.date ? WEEKDAYS[b.lang][weekdayOf(b.date) - 1] : ""
  };
  Object.keys(extra || {}).forEach(function (k) { v[k] = extra[k]; });
  return v;
}
/* builds what each channel needs; WhatsApp API needs an approved template + ordered params */
function buildMessage(kind, channel, b, cfg, extra) {
  var vars = varsFor(b, cfg, extra);
  var smsKind = TEXTS[kind + "_sms"] || (cfg.texts && cfg.texts[kind + "_sms"]) ? kind + "_sms" : kind;
  var msg = { kind: kind, channel: channel, lang: b.lang, vars: vars };
  if (channel === "email") {
    msg.to = b.email;
    msg.subject = fill(textFor(kind + "_subject", b.lang, cfg) || cfg.business.name, vars);
    msg.text = fill(textFor(kind, b.lang, cfg), vars);
    if (vars.unsub) msg.text += fill(textFor("unsub_footer", b.lang, cfg), vars);
  } else if (channel === "sms") {
    msg.to = b.phone;
    msg.text = fill(textFor(smsKind, b.lang, cfg), vars);
  } else {
    msg.to = b.phone;
    msg.text = fill(textFor(kind, b.lang, cfg), vars);
    var t = cfg.whatsapp.templates && cfg.whatsapp.templates[kind];
    if (t) msg.template = { name: t.name, lang: (cfg.whatsapp.langCodes || {})[b.lang] || b.lang, params: (t.params || []).map(function (k) { return String(vars[k] || ""); }) };
  }
  return msg;
}

/* picks the first channel this person can be reached on */
function pickChannel(b, channels, cfg, marketing) {
  for (var i = 0; i < channels.length; i++) {
    var ch = channels[i];
    if (ch === "whatsapp" && b.phone) {
      if (cfg.reminders.requireConsent && !b.wa) continue;
      if (marketing && cfg.comeback.requireMarketingConsent && !b.promo) continue;
      if (cfg.whatsapp.mode === "api" && !(cfg.whatsapp.templates || {})[marketing ? cfg.comeback.kind : cfg.reminders.kind]) continue;
      return ch;
    }
    if (ch === "sms" && b.phone) {
      if (marketing && !b.promo) continue; // ads by SMS need prior consent
      return ch;
    }
    if (ch === "email" && b.email) return ch;
  }
  return "";
}

/* ---------- signed links ---------- */

function sign(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(String(value), String(secret));
  return bytes.map(function (x) { return ("0" + (x & 0xff).toString(16)).slice(-2); }).join("").slice(0, 20);
}
function verify(value, sig, secret) {
  var good = sign(value, secret);
  if (!sig || sig.length !== good.length) return false;
  var diff = 0;
  for (var i = 0; i < good.length; i++) diff |= good.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
function link(base, params, secret) {
  if (!base) return "";
  var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
  return base + "?" + q + "&s=" + sign(params.a + "|" + (params.e || params.c), secret);
}

/* free slots for "move it": candidate start times on workdays, minus busy calendar time */
function freeSlots(busy, fromDate, cfg) {
  var out = [], mv = cfg.move;
  for (var d = 1; d <= mv.days + 7 && out.length < 6; d++) {
    var ds = addDays(fromDate, d);
    if (mv.workdays.indexOf(weekdayOf(ds)) < 0) continue;
    for (var i = 0; i < mv.starts.length && out.length < 6; i++) {
      var s = localToMs(ds, mv.starts[i], cfg.timezone), e = s + mv.durationMin * 60000;
      var clash = busy.some(function (x) { return x.s < e && x.e > s; });
      if (!clash) out.push({ date: ds, time: mv.starts[i] });
    }
  }
  return out;
}

/* ---------- what is due now ---------- */

function dueReminders(bookings, now, cfg, sent, optouts) {
  var r = cfg.reminders, tz = cfg.timezone, here = localParts(now, tz);
  if (!r.enabled || here.hour < r.sendHour || here.hour >= r.untilHour) return [];
  var target = r.when === "same_day" ? here.date : addDays(here.date, 1);
  var out = [];
  bookings.forEach(function (b) {
    if (b.date !== target || b.stop) return;
    if (optouts[contactKey(b)]) return;
    if (b.startMs && b.startMs < now.getTime() + r.minLeadMinutes * 60000) return;
    var key = "rem|" + b.id + "|" + b.date + "|" + b.time;
    if (sent[key]) return;
    var ch = pickChannel(b, r.channels, cfg, false);
    out.push({ key: key, kind: r.kind, booking: b, channel: ch });
  });
  return out;
}

/* history: all bookings in [now - maxDays, now + 90 days]; returns people whose last visit is old */
function dueComebacks(history, now, cfg, sent, optouts) {
  var c = cfg.comeback, here = localParts(now, cfg.timezone);
  if (!c.enabled || here.hour < c.sendHour) return [];
  var last = {}, future = {};
  history.forEach(function (b) {
    var k = contactKey(b);
    if (!k || b.stop) return;
    if (b.date > here.date) { future[k] = true; return; }
    if (!last[k] || last[k].date < b.date) last[k] = b;
  });
  var out = [];
  Object.keys(last).forEach(function (k) {
    var b = last[k], age = daysBetween(b.date, here.date);
    if (future[k] || optouts[k] || age < c.afterDays || age > c.maxDays) return;
    var key = "cb|" + k + "|" + b.date;
    if (sent[key]) return;
    var ch = pickChannel(b, c.channels, cfg, true);
    if (!ch) return;
    out.push({ key: key, kind: c.kind, booking: b, channel: ch, marketing: true });
  });
  out.sort(function (a, b) { return a.booking.date < b.booking.date ? -1 : 1; });
  return out.slice(0, c.perRun);
}

/* office: rows {row, name, email, lang, type:"docs"|"pay", items, done, lastSent, count, start} */
function dueDocs(rows, now, cfg, optouts) {
  var d = cfg.documents, here = localParts(now, cfg.timezone);
  if (!d.enabled || here.hour < d.sendHour) return [];
  var out = [];
  rows.forEach(function (r) {
    if (truthy(r.done) || !r.email || !String(r.items || "").trim()) return;
    if (optouts["e:" + String(r.email).toLowerCase()]) return;
    var count = parseInt(r.count, 10) || 0;
    if (count >= d.maxCount) return;
    var start = toDateStr(r.start, cfg.timezone);
    if (start && start > here.date) return;
    var lastSent = toDateStr(r.lastSent, cfg.timezone);
    if (lastSent && daysBetween(lastSent, here.date) < d.everyDays) return;
    var type = /^(pay|rechnung|счёт|счет|рахунок|invoice)/i.test(String(r.type || "")) ? "pay" : "docs";
    var lang = ["ru", "uk", "de", "en"].indexOf(r.lang) >= 0 ? r.lang : cfg.defaultLang;
    var items = String(r.items).split(/\n|;/).map(function (s) { return s.trim(); }).filter(String).map(function (s) { return "- " + s; }).join("\n");
    var b = { id: "doc" + r.row, name: String(r.name || "").trim(), email: String(r.email).trim().toLowerCase(), lang: lang, date: "", time: "" };
    out.push({ key: "doc|" + r.row + "|" + (count + 1), kind: type + "_" + Math.min(count + 1, 3), subjectKind: type + "_subject", booking: b, channel: "email", items: items, row: r.row, count: count + 1, today: here.date });
  });
  return out.slice(0, d.perRun);
}

/* assist mode: one message to the owner with tap-to-send WhatsApp links */
function waLink(phone, text) { return "https://wa.me/" + phone + "?text=" + encodeURIComponent(text); }
function buildDigest(items, cfg) {
  var lang = cfg.business.lang || cfg.defaultLang;
  var lines = items.map(function (it) {
    return "- " + (it.booking.name || it.booking.phone) + (it.booking.time ? " " + it.booking.time : "") + ": " + waLink(it.booking.phone, it.msg.text);
  });
  return { subject: fill(textFor("digest_subject", lang, cfg), { count: items.length }), text: lines.join("\n") };
}

/**
 * One run. io: see Main.gs. Returns a summary for the log and tests.
 */
function runJobs(cfg, now, io) {
  var res = { sent: [], failed: [], noChannel: [], assist: [] };
  var sent = io.sentKeys(), optouts = io.optouts(), contacts = io.contacts();
  var secret = io.secret();
  var assistItems = [];

  function deliver(item, extra) {
    var b = item.booking;
    var msg = buildMessage(item.kind, item.channel, b, cfg, extra);
    if (item.subjectKind) msg.subject = fill(textFor(item.subjectKind, b.lang, cfg), msg.vars);
    if (item.channel === "whatsapp" && cfg.whatsapp.mode !== "api") {
      item.msg = msg; assistItems.push(item); return;
    }
    var r = io.send(msg);
    if (r && r.ok) { io.markSent(item.key, item.channel, r.id || ""); res.sent.push(item.key); if (item.row) io.updateDoc(item.row, { lastSent: item.today, count: item.count }); }
    else res.failed.push({ key: item.key, error: (r && r.error) || "unknown" });
  }

  var needReminders = cfg.reminders.enabled, needComeback = cfg.comeback.enabled && cfg.comeback.source !== "clients";
  if (needReminders || needComeback) {
    var back = needComeback ? cfg.comeback.maxDays + 1 : 0;
    var raws = io.bookings(new Date(now.getTime() - back * DAY_MS), new Date(now.getTime() + (needComeback ? 90 : 2) * DAY_MS));
    var all = raws.map(function (x) { return normalizeBooking(x, cfg, contacts); });
    if (needReminders) dueReminders(all, now, cfg, sent, optouts).forEach(function (it) {
      if (!it.channel) { res.noChannel.push(it.key); return; }
      var extra = {};
      if (it.kind === "visit_day_before") extra.link = link(io.webAppUrl(), { a: "v", e: it.booking.id }, secret);
      deliver(it, extra);
    });
    if (needComeback) dueComebacks(all, now, cfg, sent, optouts).forEach(function (it) {
      deliver(it, it.channel === "email" ? { unsub: link(io.webAppUrl(), { a: "u", c: contactKey(it.booking) }, secret) } : {});
    });
  }
  if (cfg.comeback.enabled && cfg.comeback.source === "clients") {
    var here = localParts(now, cfg.timezone);
    // clients sheet: one row per client with the last visit date (cleaning)
    var hist = io.clients().map(function (r) {
      var d = toDateStr(r.last, cfg.timezone);
      return normalizeBooking({ id: "c:" + (r.email || r.phone), name: r.name, email: r.email, phone: r.phone, lang: r.lang, promo: r.promo, consent: r.consent, status: r.status, date: d, time: "" }, cfg, contacts);
    }).filter(function (b) { return b.date && b.date <= here.date; });
    dueComebacks(hist, now, cfg, sent, optouts).forEach(function (it) {
      deliver(it, it.channel === "email" ? { unsub: link(io.webAppUrl(), { a: "u", c: contactKey(it.booking) }, secret) } : {});
    });
  }
  if (cfg.documents.enabled) {
    dueDocs(io.docs(), now, cfg, optouts).forEach(function (it) { deliver(it, { items: it.items }); });
  }
  if (assistItems.length) {
    var dg = buildDigest(assistItems, cfg);
    var r = io.notifyOwner(dg.subject, dg.text);
    if (r && r.ok) assistItems.forEach(function (it) { io.markSent(it.key, "assist", ""); res.assist.push(it.key); });
    else assistItems.forEach(function (it) { res.failed.push({ key: it.key, error: "digest failed" }); });
  }
  return res;
}

/* ---------- sheet headers (owner can name columns in any of the 4 languages) ---------- */

var COLS = {
  date: { de: "Datum", ru: "Дата", uk: "Дата", en: "Date", alt: [] },
  time: { de: "Uhrzeit", ru: "Время", uk: "Час", en: "Time", alt: ["zeit"] },
  weekday: { de: "Wochentag", ru: "День недели", uk: "День тижня", en: "Weekday", alt: ["tag", "день"] },
  name: { de: "Name", ru: "Имя", uk: "Імʼя", en: "Name", alt: ["ім'я", "клиент", "клієнт", "kunde", "mandant", "client"] },
  phone: { de: "Telefon", ru: "Телефон", uk: "Телефон", en: "Phone", alt: ["handy", "mobil", "номер"] },
  email: { de: "E-Mail", ru: "Почта", uk: "Пошта", en: "Email", alt: ["e-mail", "mail", "email"] },
  lang: { de: "Sprache", ru: "Язык", uk: "Мова", en: "Language", alt: ["lang"] },
  consent: { de: "WhatsApp OK", ru: "WhatsApp можно", uk: "WhatsApp можна", en: "WhatsApp OK", alt: [] },
  promo: { de: "Angebote OK", ru: "Акции можно", uk: "Акції можна", en: "Offers OK", alt: [] },
  stop: { de: "Keine Nachrichten", ru: "Не писать", uk: "Не писати", en: "Do not message", alt: [] },
  status: { de: "Status", ru: "Статус", uk: "Статус", en: "Status", alt: [] },
  last: { de: "Letzter Termin", ru: "Последний визит", uk: "Останній візит", en: "Last visit", alt: ["letzte reinigung", "последняя уборка", "last cleaning"] },
  type: { de: "Art", ru: "Тип", uk: "Тип", en: "Type", alt: [] },
  items: { de: "Fehlt noch", ru: "Чего не хватает", uk: "Чого бракує", en: "Still missing", alt: ["missing", "fehlt"] },
  done: { de: "Erhalten", ru: "Получено", uk: "Отримано", en: "Received", alt: ["erledigt", "done", "оплачено", "bezahlt", "paid"] },
  start: { de: "Ab Datum", ru: "Начать с", uk: "Почати з", en: "Start on", alt: [] },
  lastSent: { de: "Zuletzt erinnert", ru: "Последнее письмо", uk: "Останній лист", en: "Last reminder", alt: [] },
  count: { de: "Erinnerungen", ru: "Писем отправлено", uk: "Листів надіслано", en: "Reminders sent", alt: [] }
};
var SHEETS = {
  Bookings: ["date", "time", "name", "phone", "email", "lang", "consent", "promo", "status"],
  Weekly: ["weekday", "time", "name", "phone", "lang", "consent", "promo"],
  Contacts: ["name", "phone", "email", "lang", "consent", "promo", "stop"],
  Clients: ["name", "email", "phone", "lang", "last", "status"],
  Docs: ["name", "email", "lang", "type", "items", "done", "start", "lastSent", "count"]
};
function headerLabels(sheetType, lang) { return SHEETS[sheetType].map(function (k) { return COLS[k][lang] || COLS[k].en; }); }
/* header row -> {key: columnIndex} */
function mapHeaders(row) {
  var out = {};
  row.forEach(function (h, i) {
    var t = String(h || "").trim().toLowerCase();
    if (!t) return;
    Object.keys(COLS).forEach(function (k) {
      if (out[k] !== undefined) return;
      var c = COLS[k], names = [c.de, c.ru, c.uk, c.en].map(function (s) { return s.toLowerCase(); }).concat(c.alt);
      if (names.indexOf(t) >= 0) out[k] = i;
    });
  });
  return out;
}
function rowsToObjects(values) {
  if (!values.length) return [];
  var map = mapHeaders(values[0]);
  return values.slice(1).map(function (r, i) {
    var o = { row: i + 2 };
    Object.keys(map).forEach(function (k) { o[k] = r[map[k]]; });
    return o;
  }).filter(function (o) { return Object.keys(o).some(function (k) { return k !== "row" && o[k] !== "" && o[k] !== null && o[k] !== undefined; }); });
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
