/* site kit: backend for the one-page site, in the CLIENT's Google account (a Google Sheet + this bound script).
   Two jobs, both optional:
   - GET  ?prices=1  -> prices from the sheet "Prices" as JSON. The client edits prices in the Google Sheets app on the phone,
                        the site shows them on the next page load. (shop: "change the prices yourself")
   - POST (form)     -> booking / trial request: one row in "Bookings" + one mail to the owner. (fitness: "booking comes to your email")
   Deploy: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone. Put the /exec URL into business.json
   (booking.endpoint and/or prices_endpoint).
   Script Properties: OWNER_EMAIL (where bookings go), CLIENT_ID (same as business.json "id"),
                      DELETE_AFTER_DAYS (default 90), MAX_PER_HOUR (default 30). No secrets needed. */

var PRICE_HEAD = ["Group", "Item", "Price", "From", "Show"];
var BOOK_HEAD = ["Received", "Name", "Phone", "Slot", "Message", "Lang", "Done"];

function sp_(k, d) { var v = PropertiesService.getScriptProperties().getProperty(k); return v == null || v === "" ? d : v; }

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}

function setupSite() {
  sheet_("Prices", PRICE_HEAD);
  sheet_("Bookings", BOOK_HEAD);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "cleanupBookings") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("cleanupBookings").timeBased().everyDays(1).create();
}

function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function fmtPrice_(v) {
  if (typeof v === "number") return (Math.round(v * 100) / 100).toString().replace(".", ",") + " €";
  return String(v || "").trim();
}

/* rows -> [{group, items:[{name, price, from}]}], keeps sheet order, skips rows with Show = no */
function readPrices_() {
  var rows = sheet_("Prices", PRICE_HEAD).getDataRange().getValues().slice(1);
  var groups = [], byName = {};
  rows.forEach(function (r) {
    var name = String(r[1] || "").trim();
    if (!name || /^(no|nein|нет|ні|0|false)$/i.test(String(r[4]).trim())) return;
    var g = String(r[0] || "").trim();
    if (!byName[g]) { byName[g] = { group: g, items: [] }; groups.push(byName[g]); }
    byName[g].items.push({ name: name.slice(0, 120), price: fmtPrice_(r[2]).slice(0, 40), from: /^(y|yes|ja|да|так|1|true)$/i.test(String(r[3]).trim()) });
  });
  return groups;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.prices) return json_({ groups: readPrices_(), updated: new Date().toISOString() });
  return json_({ ok: true });
}

function clean_(s, n) { return String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n); }
/* a cell that starts with = + - @ would run as a formula in the owner's sheet: store it as plain text */
function cell_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

/* returns "ok" | reason; exported for tests */
function handleBooking_(p) {
  if (p.website) return "bot";
  if (sp_("CLIENT_ID", "") && p.client !== sp_("CLIENT_ID", "")) return "wrong client";
  if (p.consent !== "yes") return "no consent";
  var name = clean_(p.name, 80), phone = clean_(p.phone, 40);
  if (!name || !/\d{5,}/.test(phone.replace(/\D/g, ""))) return "missing name or phone";
  var cache = CacheService.getScriptCache(), n = Number(cache.get("count") || 0);
  if (n >= Number(sp_("MAX_PER_HOUR", 30))) return "too many";
  cache.put("count", String(n + 1), 3600);
  /* the row and the mail are two copies: if one fails, the other still keeps the request */
  var saved = false, mailed = false, why = [];
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_("Bookings", BOOK_HEAD).appendRow([new Date(), cell_(name), "'" + phone, cell_(clean_(p.slot, 80)), cell_(clean_(p.message, 500)), clean_(p.lang, 5), false]);
      saved = true;
    } finally { lock.releaseLock(); }
  } catch (e) { why.push("sheet: " + e.message); }
  var to = sp_("OWNER_EMAIL", "");
  if (to) {
    try {
      MailApp.sendEmail(to, "Neue Anfrage: " + name + (p.slot ? ", " + clean_(p.slot, 80) : ""),
        "Name: " + name + "\nTelefon: " + phone + "\nTermin: " + clean_(p.slot, 80) + "\nNachricht: " + clean_(p.message, 500) +
        (saved ? "" : "\n\n(Nicht in der Tabelle gespeichert: " + why.join("; ") + ")") +
        "\n\nAlle Anfragen: " + SpreadsheetApp.getActiveSpreadsheet().getUrl());
      mailed = true;
    } catch (e) { why.push("mail: " + e.message); }
  }
  if (!saved && !mailed) { console.error("booking lost: " + why.join("; ")); return "failed"; }
  return "ok";
}

/* The page script sends ajax=1 and reads the JSON answer (Apps Script answers with CORS "*" for ContentService output),
   so the visitor sees "thank you" only when the request was really stored. Without JavaScript: plain HTML page. */
function doPost(e) {
  var p = (e && e.parameter) || {};
  var r;
  try { r = handleBooking_(p); } catch (err) { r = "failed"; }
  if (p.ajax) return json_({ ok: r === "ok", reason: r === "ok" ? "" : r });
  var msg = r === "ok" ? "Danke! Wir melden uns bald. / Thank you!" : "Bitte rufen Sie uns an. / Please call us.";
  return HtmlService.createHtmlOutput("<meta name=viewport content='width=device-width'><p style='font:18px sans-serif;margin:24px'>" + msg + "</p>");
}

/* GDPR: delete booking rows older than DELETE_AFTER_DAYS */
function cleanupBookings() {
  var sh = sheet_("Bookings", BOOK_HEAD), rows = sh.getDataRange().getValues();
  var limit = Date.now() - Number(sp_("DELETE_AFTER_DAYS", 90)) * 864e5;
  for (var i = rows.length - 1; i >= 1; i--) {
    var d = rows[i][0] instanceof Date ? rows[i][0].getTime() : Date.parse(rows[i][0]);
    if (d && d < limit) sh.deleteRow(i + 1);
  }
}
