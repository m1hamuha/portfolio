/**
 * Leads kit, glue to Google services.
 * Script Properties:
 *   CONFIG_JSON     the client's business.json (see ../config)
 *   LEADS_SECRET    shared secret with the Cloudflare Worker / site form (setupLeads() creates it)
 *   TG_BOT_TOKEN    Telegram bot token for alerts (optional)
 *   LLM_API_KEY     optional, only if llm.enabled (never for clinics)
 *   SHEET_ID        set by setupLeads()
 */
function lProp_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ""; }
function lCfg_() { return parseLeadsConfig(lProp_("CONFIG_JSON")); }
function lBook_() { var id = lProp_("SHEET_ID"); return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet(); }
function lSheet_(cfg) {
  var ss = lBook_(), sh = ss.getSheetByName(cfg.sheet);
  if (!sh) {
    sh = ss.insertSheet(cfg.sheet);
    sh.appendRow(L_HEAD[cfg.lang]);
    sh.setFrozenRows(1);
    if (sh.hideColumns) { sh.hideColumns(L_COL.rank + 1); sh.hideColumns(L_COL.key + 1); }
  }
  return sh;
}
function lRows_(sh) { return sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, L_HEAD.en.length).getValues() : []; }
function lFormat_(sh, cfg, n) {
  if (n < 1) return;
  sh.getRange(2, L_COL.done + 1, n, 1).insertCheckboxes();
  sh.getRange(2, L_COL.stage + 1, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(L_STAGES[cfg.lang], true).build());
}

function setupLeads() {
  var cfg = lCfg_(), p = PropertiesService.getScriptProperties();
  if (!lProp_("SHEET_ID")) p.setProperty("SHEET_ID", SpreadsheetApp.getActiveSpreadsheet().getId());
  if (!lProp_("LEADS_SECRET")) p.setProperty("LEADS_SECRET", Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, ""));
  lSheet_(cfg);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (["checkMail", "morningDigest", "onFormSubmitLead"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  if (cfg.email.enabled) ScriptApp.newTrigger("checkMail").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("morningDigest").timeBased().atHour(cfg.digestHour || 8).everyDays(1).create();
  ScriptApp.newTrigger("onFormSubmitLead").forSpreadsheet(lBook_()).onFormSubmit().create();
  return "ok";
}

function tgSend_(text, cfg) {
  var tok = lProp_("TG_BOT_TOKEN"), ok = false;
  (cfg.notify.telegramChatIds || []).forEach(function (chat) {
    if (!tok) return;
    var r = UrlFetchApp.fetch("https://api.telegram.org/bot" + tok + "/sendMessage", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: chat, text: text, disable_web_page_preview: true })
    });
    ok = ok || r.getResponseCode() === 200;
  });
  if (cfg.notify.email) { MailApp.sendEmail(cfg.notify.email, text.split("\n")[0].slice(0, 120), text); ok = true; }
  return ok;
}

function addLead_(lead, cfg, now, notify) {
  var sh = lSheet_(cfg), rows = lRows_(sh);
  var plan = planUpsert(rows, lead, now, cfg);
  if (plan.action === "append") { sh.appendRow(plan.row); lFormat_(sh, cfg, sh.getLastRow() - 1); }
  else sh.getRange(plan.index + 2, 1, 1, plan.row.length).setValues([plan.row]);
  if (notify && (plan.action === "append" || plan.reopened)) tgSend_(notifyText(lead, cfg, lBook_().getUrl()), cfg);
  return plan.action;
}

function refresh_(cfg, now, sheet) {
  var sh = sheet || lSheet_(cfg), rows = lRows_(sh);
  if (!rows.length) return 0;
  rows.forEach(function (r) { var n = computeNext(r, now, cfg); r[L_COL.rank] = n.rank; r[L_COL.next] = n.next; });
  var sorted = sortRows(rows);
  sh.getRange(2, 1, sorted.length, sorted[0].length).setValues(sorted);
  return sorted.length;
}

/* every 5 minutes: new matching mail -> rows. Only adds a label, never moves, reads or deletes mail. */
function checkMail() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return 0;
  try {
    var cfg = lCfg_(), now = new Date(), n = 0;
    if (cfg.email.enabled && cfg.email.query) {
      var label = GmailApp.getUserLabelByName(cfg.email.label) || GmailApp.createLabel(cfg.email.label);
      var threads = GmailApp.search(cfg.email.query + ' -label:"' + cfg.email.label + '"', 0, cfg.email.maxThreads);
      threads.forEach(function (th) {
        var m = th.getMessages()[0];
        var msg = { id: m.getId(), threadId: th.getId(), from: m.getFrom(), subject: m.getSubject(), body: m.getPlainBody(), date: m.getDate() };
        var lead = emailToLead(msg, cfg);
        if (lead.channel === "email" && cfg.llm.enabled) {
          var j = llmJudge(msg.subject + "\n" + msg.body, cfg, UrlFetchApp.fetch, lProp_("LLM_API_KEY"));
          if (j && !j.lead) { th.addLabel(label); return; }
          if (j && j.what) lead.what = j.what + " | " + lead.what;
        }
        addLead_(lead, cfg, now, true);
        th.addLabel(label);
        n++;
      });
    }
    refresh_(cfg, now);
    return n;
  } finally { lock.releaseLock(); }
}

/* Worker and site form post here: {secret, lead:{channel,name,contact,what,when,open,externalId}} */
function doPost(e) {
  var cfg = lCfg_(), body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (x) { body = {}; }
  var sec = lProp_("LEADS_SECRET");
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  if (!sec || body.secret !== sec) return out({ ok: false, error: "forbidden" });
  var l = body.lead || {};
  var ch = ["email", "site", "instagram", "whatsapp", "facebook", "telegram", "phone"].indexOf(l.channel) >= 0 ? l.channel : "site";
  var lead = { channel: ch, name: lClean(l.name, 60), contact: lClean(l.contact, 80), what: lClean(l.what, 300), when: lClean(l.when, 60), open: /^(https:|tg:|mailto:|tel:)/.test(l.open || "") ? String(l.open).slice(0, 300) : "", externalId: lClean(l.externalId, 120) };
  var lock = LockService.getScriptLock(); lock.tryLock(20000);
  try {
    var now = new Date();
    var action = addLead_(lead, cfg, now, true);
    refresh_(cfg, now);
    return out({ ok: true, action: action });
  } finally { lock.releaseLock(); }
}

/* Google Form "quick add" (phone calls, WhatsApp you typed in yourself) */
var L_CH_WORDS = { phone: /tel|phone|anruf|звон|дзвін|телеф/i, whatsapp: /whats/i, instagram: /insta/i, telegram: /telegr/i, facebook: /face/i, email: /mail|почт|пошт/i, site: /site|сайт|web/i };
function formToLead(named, cfg) {
  var lead = { channel: "phone", name: "", contact: "", what: "", when: "" };
  Object.keys(named || {}).forEach(function (q) {
    var v = String((named[q] || [])[0] || "").trim();
    if (!v) return;
    if (/kanal|channel|откуда|звідки/i.test(q)) { for (var c in L_CH_WORDS) if (L_CH_WORDS[c].test(v)) { lead.channel = c; break; } return; }
    var f = fieldOf_(q);
    if (f === "phone") { var p = lNormPhone(v, cfg.countryCode); lead.contact = p ? "+" + p : v; lead.open = p ? "https://wa.me/" + p : ""; }
    else if (f === "email") { if (!lead.contact) lead.contact = v; }
    else if (f) lead[f] = lClean(v, f === "what" ? 300 : 60);
  });
  lead.externalId = lead.contact || lead.name;
  return lead;
}
function onFormSubmitLead(e) {
  var cfg = lCfg_(), now = new Date();
  addLead_(formToLead(e.namedValues, cfg), cfg, now, false);
  refresh_(cfg, now);
}

/* simple trigger: stage changed -> remember the date; any change -> re-sort */
function onEdit(e) {
  var cfg = lCfg_();
  var sh = e.range.getSheet();
  if (sh.getName() !== cfg.sheet || e.range.getRow() < 2) return;
  if (e.range.getColumn() === L_COL.stage + 1) sh.getRange(e.range.getRow(), L_COL.stageDate + 1).setValue(Utilities.formatDate(new Date(), cfg.timezone, "yyyy-MM-dd"));
  if ([L_COL.stage + 1, L_COL.done + 1].indexOf(e.range.getColumn()) >= 0) refresh_(cfg, new Date(), sh); // e.source only: simple triggers may not call openById
}

function morningDigest() {
  var cfg = lCfg_(), now = new Date();
  refresh_(cfg, now);
  var sh = lSheet_(cfg), rows = lRows_(sh);
  var d = digestText(rows, cfg);
  if (d.n + d.f > 0) tgSend_(d.text + "\n" + lBook_().getUrl(), cfg);
  // data minimisation: delete finished rows older than retentionDays
  var cut = now.getTime() - cfg.retentionDays * L_DAY;
  for (var i = rows.length - 1; i >= 0; i--) {
    if (computeNext(rows[i], now, cfg).rank === 9 && new Date(rows[i][L_COL.received]).getTime() < cut) sh.deleteRows(i + 2, 1);
  }
  return d;
}
