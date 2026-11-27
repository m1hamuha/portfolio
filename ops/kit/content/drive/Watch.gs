/* Drive inbox watcher for content clients who upload to Google Drive (fitness, other).
   Runs in Mikhail's own Google account. The client folders live in the CLIENT's Google Drive
   and are shared with Mikhail as editor (no client data in Mikhail's free account, see README section 7).
   Every 15 minutes: new files in a client's Inbox folder -> one Telegram message to Mikhail,
   only after uploads have stopped for SETTLE_MIN minutes, with the promised deadline.
   Script Properties (Project Settings, Script Properties), no secrets in code:
     CLIENTS_JSON  [{"id":"fitness-kraft","inbox":"<folder id>","days":2}]
     TG_TOKEN      Telegram bot token (bot made with @BotFather)
     TG_CHAT_ID    Mikhail's chat id with that bot
   Setup: paste this file, run setup() once, allow access. */

var SETTLE_MIN = 10;
var IMG = /\.(jpe?g|png|webp|heic|heif)$/i;
var VID = /\.(mp4|mov|m4v|3gp|webm)$/i;

/* pure: files = [{name, created (ms)}], lastSeen ms -> what to report */
function planNotify(files, lastSeen, now, settleMin) {
  var fresh = files.filter(function (f) { return f.created > lastSeen && (IMG.test(f.name) || VID.test(f.name)); });
  if (!fresh.length) return { notify: false, count: 0 };
  var newest = Math.max.apply(null, fresh.map(function (f) { return f.created; }));
  if (now - newest < settleMin * 60000) return { notify: false, count: fresh.length, waiting: true };
  return {
    notify: true,
    count: fresh.length,
    photos: fresh.filter(function (f) { return IMG.test(f.name); }).length,
    videos: fresh.filter(function (f) { return VID.test(f.name); }).length,
    heic: fresh.filter(function (f) { return /\.hei[cf]$/i.test(f.name); }).length,
    newest: newest
  };
}

/* deadline: N calendar days after the upload, shown as dd.MM */
function deadline(newest, days) {
  var d = new Date(newest + (days || 2) * 86400000);
  return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2);
}

function messageFor(client, p) {
  var parts = [client.id + ": " + p.count + " new files (" + p.photos + " photos, " + p.videos + " videos)", "Due: " + deadline(p.newest, client.days)];
  if (p.heic) parts.push(p.heic + " HEIC: check they open, or send the iPhone format tip");
  return parts.join("\n");
}

function sendTelegram(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TG_TOKEN"), chat = props.getProperty("TG_CHAT_ID");
  if (!token || !chat) { Logger.log("Telegram not set: " + text); return false; }
  var r = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: text, disable_web_page_preview: true })
  });
  return r.getResponseCode() === 200;
}

function watch() {
  var props = PropertiesService.getScriptProperties();
  var clients = JSON.parse(props.getProperty("CLIENTS_JSON") || "[]");
  var now = Date.now();
  clients.forEach(function (c) {
    var key = "seen_" + c.id;
    var lastSeen = Number(props.getProperty(key) || 0);
    var files = [];
    try {
      var it = DriveApp.getFolderById(c.inbox).getFiles();
      while (it.hasNext()) { var f = it.next(); files.push({ name: f.getName(), created: f.getDateCreated().getTime() }); }
    } catch (e) {
      /* the client removed the share or deleted the folder: tell Mikhail once a day, keep checking the others */
      var ekey = "err_" + c.id, day = new Date(now).toISOString().slice(0, 10);
      if (props.getProperty(ekey) !== day && sendTelegram(c.id + ": cannot open the Inbox folder (" + String(e.message || e).slice(0, 80) + "). Was the share removed?")) props.setProperty(ekey, day);
      return;
    }
    var p = planNotify(files, lastSeen, now, SETTLE_MIN);
    if (p.notify && sendTelegram(messageFor(c, p))) props.setProperty(key, String(p.newest));
  });
}

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "watch") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("watch").timeBased().everyMinutes(15).create();
  /* start from now: files already in the folders do not trigger a message */
  var props = PropertiesService.getScriptProperties();
  JSON.parse(props.getProperty("CLIENTS_JSON") || "[]").forEach(function (c) {
    if (!props.getProperty("seen_" + c.id)) props.setProperty("seen_" + c.id, String(Date.now()));
  });
}
