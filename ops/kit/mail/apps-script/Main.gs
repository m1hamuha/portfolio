/**
 * Glue to Google services. Put the client's business.json into the Script Property CONFIG_JSON,
 * run setup() once, deploy as web app (Execute as: me, Who has access: Anyone) if links are used
 * (trades "confirm or move", unsubscribe links), and paste the web app URL into WEBAPP_URL.
 */

function loadConfig_() { return parseConfig(prop_("CONFIG_JSON")); }
function book_() {
  var id = prop_("SHEET_ID");
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet_(name, type, cfg) {
  var ss = book_(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var head = type === "Log" ? ["key", "when", "channel", "id"] : type === "Optout" ? ["contact", "when"] : headerLabels(type, cfg.business.lang || cfg.defaultLang);
    sh.appendRow(head);
    sh.setFrozenRows(1);
  }
  return sh;
}
function values_(name, type, cfg) {
  var sh = sheet_(name, type, cfg);
  return sh.getLastRow() ? sh.getDataRange().getValues() : [];
}

/* run once by hand from the editor */
function setup() {
  var cfg = loadConfig_(), props = PropertiesService.getScriptProperties();
  if (!prop_("SHEET_ID")) props.setProperty("SHEET_ID", SpreadsheetApp.getActiveSpreadsheet().getId());
  if (!prop_("LINK_SECRET")) props.setProperty("LINK_SECRET", Utilities.getUuid() + Utilities.getUuid());
  sheet_("Log", "Log", cfg); sheet_("Optout", "Optout", cfg); sheet_("Contacts", "Contacts", cfg);
  if (cfg.source.type === "sheet") { sheet_(cfg.source.sheet || "Bookings", "Bookings", cfg); if (cfg.source.weekly) sheet_(cfg.source.weekly, "Weekly", cfg); }
  if (cfg.comeback.enabled && cfg.comeback.source === "clients") sheet_(cfg.comeback.sheet || "Clients", "Clients", cfg);
  if (cfg.documents.enabled) sheet_(cfg.documents.sheet, "Docs", cfg);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "hourly") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("hourly").timeBased().everyHours(1).create();
  return "ok";
}

function hourly() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    var cfg = loadConfig_();
    var res = runJobs(cfg, new Date(), makeIo_(cfg));
    console.log(JSON.stringify(res));
    if (res.failed.length) notifyOwner_("Reminders: " + res.failed.length + " not sent", res.failed.map(function (f) { return f.key + ": " + f.error; }).join("\n"), cfg);
    trimLog_(400);
  } finally { lock.releaseLock(); }
}

function calendarBookings_(cfg, from, to) {
  var cal = cfg.source.calendarId === "primary" ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(cfg.source.calendarId);
  return cal.getEvents(from, to).filter(function (ev) { return !ev.isAllDayEvent(); }).map(function (ev) {
    return { id: ev.getId(), startMs: ev.getStartTime().getTime(), title: ev.getTitle(), text: ev.getDescription() + "\n" + ev.getLocation() };
  });
}
function sheetBookings_(cfg, from, to) {
  var tz = cfg.timezone, out = [];
  rowsToObjects(values_(cfg.source.sheet || "Bookings", "Bookings", cfg)).forEach(function (r) {
    var d = toDateStr(r.date, tz), t = toTimeStr(r.time, tz);
    if (!d || !t) return;
    out.push({ id: "r" + r.row + "@" + d + "T" + t, date: d, time: t, name: r.name, phone: r.phone, email: r.email, lang: r.lang, consent: r.consent, promo: r.promo, status: r.status });
  });
  if (cfg.source.weekly) {
    var weekly = rowsToObjects(values_(cfg.source.weekly, "Weekly", cfg)).map(function (r) { r.time = toTimeStr(r.time, tz); return r; });
    var today = localParts(new Date(), tz).date;
    for (var i = -1; i <= 2; i++) out = out.concat(expandWeekly(weekly, addDays(today, i)));
  }
  var a = localParts(from, tz).date, b = localParts(to, tz).date;
  return out.filter(function (x) { return x.date >= a && x.date <= b; });
}

function makeIo_(cfg) {
  return {
    secret: function () { return prop_("LINK_SECRET"); },
    webAppUrl: function () { return prop_("WEBAPP_URL"); },
    bookings: function (from, to) { return cfg.source.type === "sheet" ? sheetBookings_(cfg, from, to) : calendarBookings_(cfg, from, to); },
    contacts: function () {
      var map = {};
      rowsToObjects(values_("Contacts", "Contacts", cfg)).forEach(function (r) {
        var p = normalizePhone(r.phone, cfg.countryCode), e = String(r.email || "").trim().toLowerCase();
        var c = { name: r.name, lang: r.lang, wa: r.consent, promo: r.promo, stop: r.stop };
        if (p) map["p:" + p] = c;
        if (e) map["e:" + e] = c;
      });
      return map;
    },
    clients: function () { return rowsToObjects(values_(cfg.comeback.sheet || "Clients", "Clients", cfg)); },
    docs: function () { return rowsToObjects(values_(cfg.documents.sheet, "Docs", cfg)); },
    updateDoc: function (row, upd) {
      var sh = sheet_(cfg.documents.sheet, "Docs", cfg), map = mapHeaders(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]);
      if (map.lastSent !== undefined) sh.getRange(row, map.lastSent + 1).setValue(upd.lastSent);
      if (map.count !== undefined) sh.getRange(row, map.count + 1).setValue(upd.count);
    },
    sentKeys: function () {
      var s = {};
      values_("Log", "Log", cfg).slice(1).forEach(function (r) { s[r[0]] = true; });
      return s;
    },
    markSent: function (key, channel, id) { sheet_("Log", "Log", cfg).appendRow([key, new Date(), channel, id]); },
    optouts: function () {
      var s = {};
      values_("Optout", "Optout", cfg).slice(1).forEach(function (r) { s[r[0]] = true; });
      return s;
    },
    send: function (msg) { return sendMessage_(msg, cfg); },
    notifyOwner: function (subject, text) { return notifyOwner_(subject, text, cfg); }
  };
}

/* keeps the log short: data minimisation, and the sheet stays fast */
function trimLog_(days) {
  var sh = book_().getSheetByName("Log");
  if (!sh || sh.getLastRow() < 2) return;
  var vals = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues(), cut = Date.now() - days * DAY_MS, n = 0;
  for (var i = 0; i < vals.length; i++) { if (new Date(vals[i][0]).getTime() < cut) n++; else break; }
  if (n) sh.deleteRows(2, n);
}

/* ---------- web app: confirm / move / unsubscribe ---------- */

function page_(text, body) {
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1"><div style="font:18px/1.5 sans-serif;max-width:480px;margin:40px auto;padding:0 16px"><p>' + escapeHtml(text) + "</p>" + (body || "") + "</div>");
}
function doGet(e) {
  var cfg = loadConfig_(), p = (e && e.parameter) || {}, secret = prop_("LINK_SECRET");
  var id = p.e || p.c || "", lang = cfg.business.lang || cfg.defaultLang;
  if (!p.a || !verify(p.a.charAt(0) + "|" + id, p.s, secret)) return page_("Link expired.");
  // Two steps on purpose: mail scanners (e.g. Outlook Safe Links) open every link in an e-mail,
  // a one-click GET would unsubscribe people who never clicked.
  if (p.a === "u") {
    var href = prop_("WEBAPP_URL") + "?a=uu&c=" + encodeURIComponent(id) + "&s=" + p.s;
    return page_(cfg.business.name, '<p><a style="display:block;padding:14px;border-radius:10px;background:#111;color:#fff;text-decoration:none;text-align:center" href="' + escapeHtml(href) + '">' + escapeHtml(textFor("page_unsub_btn", lang, cfg)) + "</a></p>");
  }
  if (p.a === "uu") {
    sheet_("Optout", "Optout", cfg).appendRow([id, new Date()]);
    return page_(textFor("page_unsub", lang, cfg));
  }
  var cal = cfg.source.calendarId === "primary" ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(cfg.source.calendarId);
  var ev = cal.getEventById(id);
  if (!ev) return page_("Link expired.");
  var b = normalizeBooking({ id: id, startMs: ev.getStartTime().getTime(), title: ev.getTitle(), text: ev.getDescription() }, cfg, {});
  var base = prop_("WEBAPP_URL"), sig = p.s;
  if (p.a === "v") {
    var from = localParts(new Date(), cfg.timezone).date;
    var busy = cal.getEvents(new Date(), new Date(Date.now() + (cfg.move.days + 8) * DAY_MS)).map(function (x) { return { s: x.getStartTime().getTime(), e: x.getEndTime().getTime() }; });
    var slots = freeSlots(busy, from, cfg);
    var btn = function (href, label) { return '<p><a style="display:block;padding:14px;border-radius:10px;background:#111;color:#fff;text-decoration:none;text-align:center" href="' + escapeHtml(href) + '">' + escapeHtml(label) + "</a></p>"; };
    var html = btn(base + "?a=vc&e=" + encodeURIComponent(id) + "&s=" + sig, textFor("page_confirm_btn", b.lang, cfg) + ": " + fmtDate(b.date, b.lang) + " " + fmtTime(b.time, b.lang));
    html += "<p>" + escapeHtml(textFor("page_pick", b.lang, cfg)) + "</p>";
    slots.forEach(function (s) { html += btn(base + "?a=vs&e=" + encodeURIComponent(id) + "&t=" + s.date + "T" + s.time + "&s=" + sig, WEEKDAYS[b.lang][weekdayOf(s.date) - 1] + " " + fmtDate(s.date, b.lang) + " " + fmtTime(s.time, b.lang)); });
    if (cfg.business.phone) html += '<p><a href="tel:' + escapeHtml(cfg.business.phone) + '">' + escapeHtml(textFor("page_other", b.lang, cfg)) + "</a></p>";
    return page_(cfg.business.name, html);
  }
  if (p.a === "vc") {
    if (ev.getTitle().indexOf("OK ") !== 0) ev.setTitle("OK " + ev.getTitle());
    notifyOwner_(cfg.business.name, fill(textFor("owner_confirm", lang, cfg), { name: b.name, date: b.date, time: b.time }), cfg);
    return page_(textFor("page_confirmed", b.lang, cfg));
  }
  if (p.a === "vs" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.t || "")) {
    if (ev.getTitle().indexOf("MOVE? ") !== 0) ev.setTitle("MOVE? " + ev.getTitle());
    ev.setDescription(ev.getDescription() + "\nMOVE? -> " + p.t);
    notifyOwner_(cfg.business.name, fill(textFor("owner_move", lang, cfg), { name: b.name, date: b.date, time: b.time, items: p.t.replace("T", " ") }), cfg);
    return page_(textFor("page_moved", b.lang, cfg));
  }
  return page_("Link expired.");
}
