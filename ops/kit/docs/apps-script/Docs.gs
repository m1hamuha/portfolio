/* docs kit: Apps Script glue. Script bound to the CLIENT's Google Sheet, next to DocsCore.gs and Config.gs (var CONFIG = {...}).
   Works from the Google Sheets phone app: custom menus do not show there, so every action is a checkbox
   watched by an installable onEdit trigger. Run setup() once from the editor on a computer. */

var UI = {
  ru: { form: "Бланк", log: "Документы", prices: "Прайс", type: "Тип", client: "Клиент", address: "Адрес клиента", phone: "Телефон", email: "Почта",
        lang: "Язык документа", sdate: "Дата работ", total: "ИТОГО", make: "Сделать PDF", mail: "И отправить на почту", m2: "Площадь, м²", visits: "Раз в неделю (0 = разово)",
        extras: "Доп. работы", text: "Работа", unit: "Ед.", price: "Цена", qty: "Кол-во", sum: "Сумма", done: "Готово: ", fix: "Не хватает: ", paid: "Оплачено / принято" },
  uk: { form: "Бланк", log: "Документи", prices: "Прайс", type: "Тип", client: "Клієнт", address: "Адреса клієнта", phone: "Телефон", email: "Пошта",
        lang: "Мова документа", sdate: "Дата робіт", total: "РАЗОМ", make: "Зробити PDF", mail: "І надіслати поштою", m2: "Площа, м²", visits: "Разів на тиждень (0 = разово)",
        extras: "Дод. роботи", text: "Робота", unit: "Од.", price: "Ціна", qty: "К-сть", sum: "Сума", done: "Готово: ", fix: "Бракує: ", paid: "Сплачено / прийнято" },
  de: { form: "Formular", log: "Dokumente", prices: "Preise", type: "Art", client: "Kunde", address: "Adresse Kunde", phone: "Telefon", email: "E-Mail",
        lang: "Sprache", sdate: "Leistungsdatum", total: "GESAMT", make: "PDF erstellen", mail: "Und per E-Mail senden", m2: "Fläche, m²", visits: "Mal pro Woche (0 = einmalig)",
        extras: "Extras", text: "Leistung", unit: "Einh.", price: "Preis", qty: "Menge", sum: "Betrag", done: "Fertig: ", fix: "Es fehlt: ", paid: "Bezahlt / angenommen" },
  en: { form: "Form", log: "Documents", prices: "Prices", type: "Type", client: "Client", address: "Client address", phone: "Phone", email: "Email",
        lang: "Document language", sdate: "Service date", total: "TOTAL", make: "Make PDF", mail: "And send by email", m2: "Area, m²", visits: "Times per week (0 = one-off)",
        extras: "Extras", text: "Item", unit: "Unit", price: "Price", qty: "Qty", sum: "Amount", done: "Done: ", fix: "Missing: ", paid: "Paid / accepted" }
};
var LOG_HEAD = ["no", "type", "date", "client", "phone", "email", "lang", "total", "due", "paid", "pdf", "message", "whatsapp", "reminder", "reminder whatsapp"];
var BLOCK = 14; // first data row of the mode block

function C_() { return CONFIG; }
function U_(k) { return UI[C_().ui_lang || "ru"][k]; }
function P_() { return PropertiesService.getScriptProperties(); }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name) { return ss_().getSheetByName(name) || ss_().insertSheet(name); }
function today_() { return dIso(new Date()); }

function setup() {
  var cfg = C_();
  var errs = validateDocsConfig(cfg);
  if (errs.length) throw new Error("CONFIG: " + errs.join("; "));
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  if (!P_().getProperty("FOLDER_ID")) P_().setProperty("FOLDER_ID", DriveApp.createFolder(cfg.business.name + " PDF").getId());
  ["quote", "invoice"].forEach(function (t) { P_().setProperty("TEMPLATE_" + t, createTemplate_(t).getId()); });
  if (cfg.mode === "manual") return { manual: true }; // other.docs: only the two Google Docs, no sheet logic
  buildForm_();
  var log = sh_(U_("log"));
  if (log.getLastRow() === 0) log.appendRow(LOG_HEAD);
  log.getRange("J2:J1000").insertCheckboxes();
  ScriptApp.newTrigger("onEditInstalled").forSpreadsheet(ss_()).onEdit().create();
  ScriptApp.newTrigger("refreshReminders").timeBased().everyDays(1).atHour(7).create();
  return { ok: true };
}

function buildForm_() {
  var cfg = C_();
  var f = sh_(U_("form"));
  f.clear();
  var top = [
    [cfg.business.name, ""],
    [U_("type"), dt(cfg.ui_lang || "ru", "quote")],
    [U_("client"), ""], [U_("address"), ""], [U_("phone"), ""], [U_("email"), ""],
    [U_("lang"), cfg.customer_lang || cfg.doc_lang],
    [U_("sdate"), ""], [U_("total"), ""], [U_("make"), false], [U_("mail"), false], ["", ""]
  ];
  f.getRange(1, 1, top.length, 2).setValues(top);
  f.getRange("B2").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([dt(cfg.ui_lang || "ru", "quote"), dt(cfg.ui_lang || "ru", "invoice")]).build());
  f.getRange("B7").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(DOC_LANGS).build());
  f.getRange("B10:B11").insertCheckboxes();
  /* same rounding as calcDoc: total = round(net) + round(net * rate) */
  var totalF = function (net) { return cfg.vat.mode === "regular" ? "=ROUND(" + net + ",2)+ROUND(" + net + "*" + cfg.vat.rate + "/100,2)" : "=ROUND(" + net + ",2)"; };
  if (cfg.mode === "items") {
    f.getRange(13, 1, 1, 6).setValues([["✓", U_("text"), U_("unit"), U_("price"), U_("qty"), U_("sum")]]);
    var rows = cfg.prices.map(function (p) { return [false, p.name, p.unit || "", p.price, "", ""]; });
    for (var i = 0; i < (cfg.free_rows || 3); i++) rows.push([false, "", "", "", "", ""]);
    f.getRange(BLOCK, 1, rows.length, 6).setValues(rows);
    var last = BLOCK + rows.length - 1;
    f.getRange(BLOCK, 1, rows.length, 1).insertCheckboxes();
    f.getRange(BLOCK, 6, rows.length, 1).setFormulas(rows.map(function (_, k) { var r = BLOCK + k; return ["=IF(A" + r + ",ROUND(N(D" + r + ")*IF(E" + r + "=\"\",1,N(E" + r + ")),2),0)"]; }));
    f.getRange("B9").setFormula(totalF("SUM(F" + BLOCK + ":F" + last + ")"));
  } else if (cfg.mode === "area") {
    var a = cfg.area;
    f.getRange(BLOCK, 1, 2, 2).setValues([[U_("m2"), ""], [U_("visits"), 1]]);
    var ex = (a.extras || []).map(function (e) { return [false, e.name, e.price]; });
    f.getRange(BLOCK + 2, 1, 1, 3).setValues([["✓", U_("extras"), U_("price")]]);
    if (ex.length) { f.getRange(BLOCK + 3, 1, ex.length, 3).setValues(ex); f.getRange(BLOCK + 3, 1, ex.length, 1).insertCheckboxes(); }
    /* same rule as calcDoc: visit = max(min, m2*rate) * (1 - discount); monthly = visit * round(visits*weeks, 2) */
    var disc = (a.discounts || []).slice().sort(function (x, y) { return x.from_visits_week - y.from_visits_week; })
      .reduce(function (acc, d) { return "IF($B$" + (BLOCK + 1) + ">=" + d.from_visits_week + "," + d.pct + "," + acc + ")"; }, "0");
    var visit = "ROUND(MAX(" + a.min_visit + ",N($B$" + BLOCK + ")*" + a.rate_m2 + ")*(1-" + disc + "/100),2)";
    var qty = "IF(N($B$" + (BLOCK + 1) + ")>0,ROUND($B$" + (BLOCK + 1) + "*" + (a.weeks_month || 4.33) + ",2),1)";
    var extrasSum = ex.length ? "+SUMIF(A" + (BLOCK + 3) + ":A" + (BLOCK + 2 + ex.length) + ",TRUE,C" + (BLOCK + 3) + ":C" + (BLOCK + 2 + ex.length) + ")" : "";
    f.getRange("B9").setFormula(totalF("(ROUND(" + visit + "*" + qty + ",2)" + extrasSum + ")"));
  } else {
    f.getRange(13, 1, 1, 4).setValues([[U_("text"), U_("qty"), U_("price"), U_("sum")]]);
    var n = cfg.free_rows || 6;
    var blank = []; for (var j = 0; j < n; j++) blank.push(["", "", "", ""]);
    f.getRange(BLOCK, 1, n, 4).setValues(blank);
    f.getRange(BLOCK, 4, n, 1).setFormulas(blank.map(function (_, k) { var r = BLOCK + k; return ["=IF(C" + r + "=\"\",\"\",ROUND(N(C" + r + ")*IF(B" + r + "=\"\",1,N(B" + r + ")),2))"]; }));
    f.getRange("B9").setFormula(totalF("SUM(D" + BLOCK + ":D" + (BLOCK + n - 1) + ")"));
  }
}

/* read the form tab into {doc fields, calc input} */
function readForm_() {
  var cfg = C_();
  var f = sh_(U_("form"));
  var v = f.getRange("B2:B11").getValues().map(function (r) { return r[0]; });
  var type = String(v[0]).trim() === dt(cfg.ui_lang || "ru", "invoice") ? "invoice" : "quote";
  var input = {};
  if (cfg.mode === "items") {
    var n = cfg.prices.length + (cfg.free_rows || 3);
    input.lines = f.getRange(BLOCK, 1, n, 5).getValues().filter(function (r) { return truthy(r[0]) && (r[1] || r[3]); })
      .map(function (r) { return { text: r[1], unit: r[2], price: r[3], qty: r[4] === "" ? 1 : r[4] }; });
  } else if (cfg.mode === "area") {
    var a = f.getRange(BLOCK, 2, 2, 1).getValues();
    var ex = cfg.area.extras || [];
    var chk = ex.length ? f.getRange(BLOCK + 3, 1, ex.length, 1).getValues() : [];
    input = { area_m2: a[0][0], visits_week: a[1][0], extras: ex.filter(function (_, i) { return truthy(chk[i][0]); }).map(function (e) { return e.id; }) };
  } else {
    input.lines = f.getRange(BLOCK, 1, cfg.free_rows || 6, 3).getValues().filter(function (r) { return r[0] || r[2]; })
      .map(function (r) { return { text: r[0], qty: r[1], price: r[2] }; });
  }
  var calcCfg = cfg.mode === "items" ? Object.assign({}, cfg, { mode: "lines" }) : cfg;
  return { type: type, client: String(v[1]).trim(), client_address: String(v[2]).trim(), phone: v[3], email: String(v[4]).trim(),
    lang: DOC_LANGS.indexOf(String(v[5])) >= 0 ? String(v[5]) : cfg.doc_lang, service_date: v[6] ? dIso(v[6]) : "",
    make: truthy(v[8]), send: truthy(v[9]), calc: calcDoc(calcCfg, input) };
}

function onEditInstalled(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== U_("form")) return;
  if (e.range.getRow() === 10 && e.range.getColumn() === 2 && truthy(e.value)) makeDocument();
}

function makeDocument() {
  var cfg = C_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var f = sh_(U_("form"));
  try {
    var d = readForm_();
    var date = today_();
    var year = date.slice(0, 4);
    var prefix = d.type === "invoice" ? (cfg.invoice_prefix || "RE") : (cfg.quote_prefix || "AN");
    var key = "LAST_" + d.type;
    var no = nextNumber(prefix, year, P_().getProperty(key));
    var doc = { type: d.type, no: no, date: date, client: d.client, client_address: d.client_address, lang: d.lang, service_date: d.service_date || date, calc: d.calc };
    var missing = d.type === "invoice" ? invoiceProblems(cfg, doc) : (d.client && d.calc.lines.length ? [] : ["client / lines"]);
    if (missing.length) { f.getRange("A12").setValue(U_("fix") + missing.join(", ")); return null; }
    var pdf = renderPdf_(cfg, doc);
    P_().setProperty(key, no); // number is used only once a PDF exists
    var due = d.type === "invoice" ? dAdd(date, cfg.pay_days || 14) : "";
    var row = { no: no, type: d.type, date: date, client: d.client, total: d.calc.total, due: due, lang: d.lang };
    var msg = messageFor(d.type === "invoice" ? "send_invoice" : "send_quote", cfg, row, date);
    var log = sh_(U_("log"));
    var at = log.getLastRow() + 1;
    log.getRange(at, 1, 1, LOG_HEAD.length).setValues([[no, d.type, date, d.client, String(d.phone || ""), d.email, d.lang, d.calc.total, due, false, pdf.getUrl(), msg, waLinkD(d.phone, msg, cfg.country_code), "", ""]]);
    var mailNote = "";
    if (d.send && d.email) {
      /* the PDF and the log row exist already; a mail error (daily quota, bad address) is shown, not hidden */
      try { MailApp.sendEmail({ to: d.email, subject: dt(d.lang, d.type) + " " + no + " " + cfg.business.name, body: msg, attachments: [pdf.getBlob ? pdf.getBlob() : pdf], name: cfg.business.name }); }
      catch (err) { mailNote = " | mail NOT sent: " + String(err.message || err).slice(0, 80) + " (send the PDF by WhatsApp)"; console.error(err); }
    }
    f.getRange("A12").setValue(U_("done") + no + " " + money(d.calc.total, d.lang) + mailNote);
    return { no: no, url: pdf.getUrl(), total: d.calc.total, message: msg, mail_error: mailNote || null };
  } catch (err) {
    /* runs from an edit trigger: the owner on the phone sees no error dialog, so write it into the sheet */
    f.getRange("A12").setValue("ERROR: " + String(err.message || err).slice(0, 150));
    throw err;
  } finally {
    f.getRange("B10:B11").setValues([[false], [false]]);
    lock.releaseLock();
  }
}

/* copy the Google Docs template, fill it, save as PDF in the client's Drive folder, drop the copy */
function renderPdf_(cfg, doc) {
  var tplFile = DriveApp.getFileById(P_().getProperty("TEMPLATE_" + doc.type));
  var folder = DriveApp.getFolderById(P_().getProperty("FOLDER_ID"));
  var copy = tplFile.makeCopy(doc.no + " " + doc.client, folder);
  var d = DocumentApp.openById(copy.getId());
  var body = d.getBody();
  fillBody_(body, docPlaceholders(cfg, doc), tableRows(cfg, doc));
  d.saveAndClose();
  var blob = copy.getAs("application/pdf").setName(doc.no + " " + doc.client + ".pdf");
  var pdf = folder.createFile(blob);
  copy.setTrashed(true);
  return pdf;
}

function fillBody_(body, ph, rows) {
  var table = body.getTables()[0];
  if (table) {
    while (table.getNumRows() > 1) table.removeRow(table.getNumRows() - 1);
    var head = table.getRow(0);
    rows[0].forEach(function (h, i) { head.getCell(i).setText(h); });
    rows.slice(1).forEach(function (r) { var tr = table.appendTableRow(); r.forEach(function (c) { tr.appendTableCell(c); }); });
  }
  Object.keys(ph).forEach(function (k) { body.replaceText(k.replace(/[{}]/g, "\\$&"), ph[k]); });
}

/* The template is a normal Google Doc: the client can add a logo, change fonts and colours.
   Only the {{...}} words and the one table must stay. */
function createTemplate_(type) {
  var cfg = C_();
  var d = DocumentApp.create(cfg.business.name + " " + dt(cfg.doc_lang, type) + " template");
  var b = d.getBody();
  b.appendParagraph("{{biz_name}}").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  b.appendParagraph("{{biz_address}}");
  b.appendParagraph("{{biz_contact}}");
  b.appendParagraph("{{biz_tax}}");
  b.appendParagraph("");
  b.appendParagraph("{{client}}");
  b.appendParagraph("{{client_address}}");
  b.appendParagraph("");
  b.appendParagraph("{{title}}").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  b.appendParagraph("{{date_label}}: {{date}}    {{extra_label}}: {{extra}}");
  b.appendTable([["#", "-", "-", "-", "-"], ["", "", "", "", ""]]);
  b.appendParagraph("{{totals}}");
  b.appendParagraph("");
  b.appendParagraph("{{notes}}");
  b.appendParagraph("{{biz_bank}}");
  b.appendParagraph("{{footer}}");
  if (cfg.mode === "manual") {
    /* other.docs: a ready document with sample values the owner overwrites on the phone */
    var sample = { type: type, no: (type === "invoice" ? (cfg.invoice_prefix || "RE") : (cfg.quote_prefix || "AN")) + "-" + today_().slice(0, 4) + "-0001",
      date: today_(), client: cfg.sample_client || "Name", client_address: "", lang: cfg.doc_lang, service_date: today_(),
      calc: calcDoc(cfg, { lines: cfg.sample_lines || [{ text: "...", qty: 1, price: 0 }] }) };
    fillBody_(b, docPlaceholders(cfg, sample), tableRows(cfg, sample));
  }
  d.saveAndClose();
  return DriveApp.getFileById(d.getId());
}

/* daily: next reminder text and WhatsApp link for every open invoice / unanswered quote */
function refreshReminders() {
  var cfg = C_();
  var log = sh_(U_("log"));
  if (log.getLastRow() < 2) return 0;
  var v = log.getRange(2, 1, log.getLastRow() - 1, LOG_HEAD.length).getValues();
  var t = today_();
  var n = 0;
  var out = v.map(function (r) {
    var row = { no: r[0], type: r[1], date: r[2], client: r[3], lang: r[6], total: r[7], due: r[8], paid: r[9] };
    var st = reminderStage(row, t, cfg);
    if (!st) return ["", ""];
    n++;
    var text = messageFor(st, cfg, row, t);
    return [text, waLinkD(r[4], text, cfg.country_code)];
  });
  log.getRange(2, 14, out.length, 2).setValues(out);
  return n;
}
