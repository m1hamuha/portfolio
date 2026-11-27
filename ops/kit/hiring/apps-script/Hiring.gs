/* hiring kit: Apps Script glue. A standalone script in the CLIENT's Google account (script.google.com),
   next to HiringCore.gs and Config.gs (var CONFIG = {...}, made by bin/config-gs.mjs).
   Run setup() once: it creates the Google Form, the answers sheet, the "fits" columns and the triggers.
   No secrets needed: mail goes out from the client's own Gmail via MailApp. */

function H_() { return CONFIG; }
function HP_() { return PropertiesService.getScriptProperties(); }

function setup() {
  var cfg = H_();
  var errs = validateHiringConfig(cfg);
  if (errs.length) throw new Error("CONFIG: " + errs.join("; "));
  var spec = buildFormSpec(cfg);
  var lint = lintQuestions(spec);
  if (lint.length) throw new Error("FORM: " + lint.map(function (x) { return x.id + " " + x.why; }).join("; "));
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });

  var form = FormApp.create(spec.title);
  form.setDescription(spec.description);
  form.setConfirmationMessage(spec.confirmation);
  form.setCollectEmail(false);            // no Google login for applicants
  form.setLimitOneResponsePerUser(false); // true would force a Google login
  form.setAllowResponseEdits(false);
  form.setProgressBar(false);
  spec.items.forEach(function (it) {
    var item;
    if (it.type === "text") item = form.addTextItem();
    else if (it.type === "para") item = form.addParagraphTextItem();
    else if (it.type === "date") item = form.addDateItem();
    else if (it.type === "choice") { item = form.addMultipleChoiceItem(); item.setChoiceValues(it.options); }
    item.setTitle(it.title).setRequired(it.required);
  });

  openForm_(form);

  var ss = SpreadsheetApp.create(cfg.business.name + " | " + (cfg.job.title_de || cfg.job.title));
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  var sh = ss.getSheets().filter(function (s) { return s.getFormUrl && s.getFormUrl(); })[0];
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.getRange(1, head.length + 1, 1, 2).setValues([[cfg.owner_lang === "de" ? "Passt?" : "Подходит?", "why"]]);

  HP_().setProperty("FORM_ID", form.getId());
  HP_().setProperty("SHEET_ID", ss.getId());
  HP_().setProperty("SPEC", JSON.stringify(spec));
  ScriptApp.newTrigger("onSubmit").forForm(form).onFormSubmit().create();
  ScriptApp.newTrigger("cleanup").timeBased().everyDays(1).atHour(4).create();
  var url = form.getPublishedUrl();
  return { form_url: url, short_url: form.shortenFormUrl ? form.shortenFormUrl(url) : url, sheet_url: ss.getUrl() };
}

/* answers by question id, from a form submit event (e.response) or from a sheet row */
function answersFrom_(spec, byTitle) {
  var a = {};
  spec.items.forEach(function (it) { a[it.id] = byTitle[it.title] === undefined ? "" : byTitle[it.title]; });
  return a;
}

function onSubmit(e) {
  var cfg = H_();
  var spec = JSON.parse(HP_().getProperty("SPEC"));
  var byTitle = {};
  e.response.getItemResponses().forEach(function (r) { byTitle[r.getItem().getTitle()] = r.getResponse(); });
  var a = answersFrom_(spec, byTitle);
  var today = new Date().toISOString().slice(0, 10);
  var fit = fitCheck(a, cfg.fit_rules, today);
  var ss = SpreadsheetApp.openById(HP_().getProperty("SHEET_ID"));
  var sh = ss.getSheets().filter(function (s) { return s.getFormUrl && s.getFormUrl(); })[0];
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var note = "";
  try {
    SpreadsheetApp.flush();
    var row = rowForResponse_(sh, e.response);
    var cols = sh.getLastColumn();
    if (cfg.notify.mode === "email" && (fit.fits || cfg.notify.all)) {
      var m = candidateMail(cfg, spec, a, fit);
      /* a failed mail (daily quota) must not lose the candidate: the row stays and says so */
      try { MailApp.sendEmail(cfg.notify.to, m.subject, m.body + "\n\n" + ss.getUrl()); }
      catch (err) { note = " | mail not sent: " + String(err).slice(0, 80); console.error(err); }
    }
    sh.getRange(row, cols - 1, 1, 2).setValues([[fit.fits ? "✔" : "", fit.why.join(", ") + note]]);
  } finally { lock.releaseLock(); }
  return fit;
}

/* Row of this response in the answers sheet: match the timestamp from the bottom (two people can submit
   at the same second), fall back to the last row. */
function rowForResponse_(sh, response) {
  var last = sh.getLastRow();
  var ts = response && typeof response.getTimestamp === "function" ? response.getTimestamp() : null;
  if (!ts) return last;
  var col = sh.getRange(1, 1, last, 1).getValues();
  for (var r = last; r >= 2; r--) {
    var v = col[r - 1][0];
    if (v && typeof v.getTime === "function" && Math.abs(v.getTime() - ts.getTime()) < 2000) return r;
  }
  return last;
}

/* GDPR: delete answers older than retention_months, in the sheet and in the form */
function cleanup() {
  var cfg = H_();
  var cutoff = retentionCutoff(new Date().toISOString().slice(0, 10), cfg.retention_months || 6);
  var form = FormApp.openById(HP_().getProperty("FORM_ID"));
  var removed = 0;
  form.getResponses().forEach(function (r) {
    if (r.getTimestamp().toISOString().slice(0, 10) < cutoff) { form.deleteResponse(r.getId()); removed++; }
  });
  var ss = SpreadsheetApp.openById(HP_().getProperty("SHEET_ID"));
  var sh = ss.getSheets().filter(function (s) { return s.getFormUrl && s.getFormUrl(); })[0];
  for (var row = sh.getLastRow(); row >= 2; row--) {
    var ts = sh.getRange(row, 1).getValue();
    var d = ts && typeof ts.toISOString === "function" ? ts.toISOString().slice(0, 10) : String(ts).slice(0, 10);
    if (d && d < cutoff) sh.deleteRow(row);
  }
  return removed;
}

/* Make sure applicants / staff can answer without a Google login. Newer FormApp versions can create a form
   unpublished (create(title, isPublished)); a Google Workspace domain may restrict forms to its own users. */
function openForm_(form) {
  try { if (typeof form.isPublished === "function" && !form.isPublished()) form.setPublished(true); } catch (e) { console.warn("setPublished: " + e); }
  try { if (typeof form.setRequireLogin === "function") form.setRequireLogin(false); } catch (e) { console.warn("setRequireLogin: " + e); }
  try { if (typeof form.setAcceptingResponses === "function") form.setAcceptingResponses(true); } catch (e) { console.warn("setAcceptingResponses: " + e); }
  return form;
}
