/* docs kit: pure logic for quotes (Angebot / Kostenvoranschlag) and simple invoices (Rechnung).
   Plain script, no imports, no network. Runs in Google Apps Script (next to apps-script/Docs.gs) and in node tests. */

var DOC_LANGS = ["de", "en", "ru", "uk"];

function dnum(x) {
  if (typeof x === "number") return isFinite(x) ? x : 0;
  var s = String(x === null || x === undefined ? "" : x).trim().replace(/\s|€|EUR/gi, "");
  if (!s) return 0;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function truthy(v) { return v === true || /^(true|wahr|1|x|да|так|ja|yes)$/i.test(String(v).trim()); }

function dIso(d) {
  if (d && typeof d.getFullYear === "function") {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  var s = String(d || "").trim();
  var de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (de) return de[3] + "-" + ("0" + de[2]).slice(-2) + "-" + ("0" + de[1]).slice(-2);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  throw new Error("bad date: " + s);
}
function dAdd(d, n) { var p = dIso(d).split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)).toISOString().slice(0, 10); }
function dDiff(a, b) { var pa = dIso(a).split("-"), pb = dIso(b).split("-"); return (Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 86400000; }
function dShow(d, lang) { var p = dIso(d).split("-"); return lang === "en" ? p[2] + "/" + p[1] + "/" + p[0] : p[2] + "." + p[1] + "." + p[0]; }

function money(n, lang) {
  var neg = n < 0; n = Math.abs(r2(n));
  var parts = n.toFixed(2).split(".");
  var sep = lang === "en" ? "," : (lang === "de" ? "." : " ");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (neg ? "-" : "") + parts[0] + (lang === "en" ? "." : ",") + parts[1] + " €";
}

function tpl(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] === undefined || v[k] === null ? "" : String(v[k]); }); }

/* ---------- price calculation ---------- */
/* cfg.mode:
   "items": trades. cfg.prices [{id, name, unit, price}], input.lines [{id, qty}] or [{text, unit, qty, price}]
   "area":  cleaning. cfg.area {rate_m2, min_visit, weeks_month, discounts: [{from_visits_week, pct}], extras: [{id, name, price}]}
            input {area_m2, visits_week (0 = one-off), extras: [ids]}
   "lines": office / other. input.lines [{text, qty, price}]
   cfg.vat: {mode: "regular", rate: 19} | {mode: "small"} (Kleinunternehmer §19 UStG, no VAT shown)
   Prices in cfg are NET when vat.mode = regular, final when small. */
function calcDoc(cfg, input) {
  var lines = [];
  var mode = cfg.mode || "lines";
  if (mode === "items") {
    var byId = {};
    (cfg.prices || []).forEach(function (p) { byId[p.id] = p; });
    (input.lines || []).forEach(function (l) {
      var q = dnum(l.qty === undefined ? 1 : l.qty);
      if (!q) return;
      if (l.id) {
        var p = byId[l.id];
        if (!p) throw new Error("unknown price id " + l.id);
        lines.push({ text: p.name, unit: p.unit || "", qty: q, price: dnum(p.price) });
      } else lines.push({ text: l.text, unit: l.unit || "", qty: q, price: dnum(l.price) });
    });
    if (cfg.travel && dnum(cfg.travel.price)) lines.push({ text: cfg.travel.name, unit: "", qty: 1, price: dnum(cfg.travel.price) });
  } else if (mode === "area") {
    var a = cfg.area;
    var m2 = dnum(input.area_m2);
    var perWeek = dnum(input.visits_week);
    var visit = Math.max(dnum(a.min_visit), m2 * dnum(a.rate_m2));
    var disc = 0;
    (a.discounts || []).forEach(function (d) { if (perWeek >= d.from_visits_week) disc = Math.max(disc, dnum(d.pct)); });
    visit = r2(visit * (1 - disc / 100));
    if (perWeek > 0) {
      var perMonth = r2(perWeek * dnum(a.weeks_month || 4.33));
      lines.push({ text: tpl(a.text_regular, { m2: m2, n: perWeek }), unit: a.unit_visit || "", qty: perMonth, price: visit, per_month: true });
    } else {
      lines.push({ text: tpl(a.text_once, { m2: m2 }), unit: "", qty: 1, price: visit });
    }
    var ex = {};
    (a.extras || []).forEach(function (e) { ex[e.id] = e; });
    (input.extras || []).forEach(function (id) { if (ex[id]) lines.push({ text: ex[id].name, unit: "", qty: 1, price: dnum(ex[id].price) }); });
  } else {
    (input.lines || []).forEach(function (l) {
      var q = dnum(l.qty === undefined || l.qty === "" ? 1 : l.qty);
      if (!l.text && !dnum(l.price)) return;
      lines.push({ text: l.text, unit: l.unit || "", qty: q, price: dnum(l.price) });
    });
  }
  lines.forEach(function (l) { l.sum = r2(l.qty * l.price); });
  var net = r2(lines.reduce(function (s, l) { return s + l.sum; }, 0));
  var vat = cfg.vat || { mode: "regular", rate: 19 };
  var tax = vat.mode === "regular" ? r2(net * dnum(vat.rate) / 100) : 0;
  return { lines: lines, net: net, vat_rate: vat.mode === "regular" ? dnum(vat.rate) : 0, vat: tax, total: r2(net + tax), small: vat.mode !== "regular", monthly: lines.some(function (l) { return l.per_month; }) };
}

/* AN-2026-0007 / RE-2026-0012. Invoice numbers must be unique and should run without gaps (GoBD practice). */
function nextNumber(prefix, year, lastNo) {
  var last = 0;
  var m = String(lastNo || "").match(/^(.*)-(\d{4})-(\d+)$/);
  if (m && m[1] === prefix && +m[2] === +year) last = +m[3];
  return prefix + "-" + year + "-" + ("000" + (last + 1)).slice(-4);
}

/* ---------- texts ---------- */

var DOC_TEXTS = {
  de: {
    quote: "Angebot", invoice: "Rechnung", no: "Nr.", date: "Datum", valid: "Gültig bis", service_date: "Leistungsdatum", due: "Zahlbar bis",
    pos: "Pos.", desc: "Leistung", qty: "Menge", unit_price: "Einzelpreis", sum: "Betrag",
    net: "Netto", vat: "USt. {rate} %", total: "Gesamt", per_month: "pro Monat",
    small_note: "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
    pay_note: "Bitte überweisen Sie den Betrag bis {due} auf das unten genannte Konto. Verwendungszweck: {no}.",
    quote_note: "Dieses Angebot ist bis {valid} gültig. Preise für die beschriebenen Leistungen, Mehraufwand nach Absprache.",
    send_quote: "Guten Tag {client}, anbei mein Angebot {no} über {total}. Bei Fragen melden Sie sich gern. Viele Grüße, {owner}",
    send_invoice: "Guten Tag {client}, anbei die Rechnung {no} über {total}, zahlbar bis {due}. Vielen Dank für den Auftrag! {owner}",
    follow_quote: "Guten Tag {client}, haben Sie mein Angebot {no} erhalten? Ich halte Ihnen den Termin gern frei. Viele Grüße, {owner}",
    rem1: "Guten Tag {client}, eine kurze Erinnerung: Die Rechnung {no} über {total} war am {due} fällig. Falls schon bezahlt, vielen Dank und bitte ignorieren. {owner}",
    rem2: "Guten Tag {client}, die Rechnung {no} über {total} ist seit {days} Tagen offen. Bitte überweisen Sie den Betrag bis {deadline}. Danke! {owner}",
    rem3: "Guten Tag {client}, trotz Erinnerung ist die Rechnung {no} über {total} noch offen ({days} Tage). Bitte zahlen Sie bis {deadline}, sonst muss ich weitere Schritte einleiten. {owner}"
  },
  en: {
    quote: "Quote", invoice: "Invoice", no: "No.", date: "Date", valid: "Valid until", service_date: "Service date", due: "Due by",
    pos: "#", desc: "Service", qty: "Qty", unit_price: "Unit price", sum: "Amount",
    net: "Net", vat: "VAT {rate} %", total: "Total", per_month: "per month",
    small_note: "No VAT is charged under the small business rule (§ 19 UStG).",
    pay_note: "Please transfer the amount by {due} to the account below. Reference: {no}.",
    quote_note: "This quote is valid until {valid}. Extra work only after agreement.",
    send_quote: "Hi {client}, here is my quote {no} for {total}. Any questions, just write. Best, {owner}",
    send_invoice: "Hi {client}, here is invoice {no} for {total}, due by {due}. Thank you for the job! {owner}",
    follow_quote: "Hi {client}, did you get my quote {no}? I can keep the date free for you. Best, {owner}",
    rem1: "Hi {client}, a quick reminder: invoice {no} for {total} was due on {due}. If you have paid already, thank you and please ignore this. {owner}",
    rem2: "Hi {client}, invoice {no} for {total} has been open for {days} days. Please transfer the amount by {deadline}. Thanks! {owner}",
    rem3: "Hi {client}, invoice {no} for {total} is still open after a reminder ({days} days). Please pay by {deadline}, or I will have to take further steps. {owner}"
  },
  ru: {
    quote: "Смета", invoice: "Счёт", no: "№", date: "Дата", valid: "Действует до", service_date: "Дата работ", due: "Оплатить до",
    pos: "№", desc: "Работа", qty: "Кол-во", unit_price: "Цена", sum: "Сумма",
    net: "Без НДС", vat: "НДС {rate} %", total: "Итого", per_month: "в месяц",
    small_note: "НДС не начисляется (§ 19 UStG, малый предприниматель).",
    pay_note: "Пожалуйста, переведите сумму до {due} на счёт ниже. Назначение платежа: {no}.",
    quote_note: "Смета действует до {valid}. Дополнительные работы по договорённости.",
    send_quote: "Здравствуйте, {client}! Отправляю смету {no} на {total}. Если есть вопросы, пишите. {owner}",
    send_invoice: "Здравствуйте, {client}! Отправляю счёт {no} на {total}, оплатить до {due}. Спасибо за заказ! {owner}",
    follow_quote: "Здравствуйте, {client}! Смета {no} дошла? Могу придержать для вас дату. {owner}",
    rem1: "Здравствуйте, {client}! Напоминаю: счёт {no} на {total} нужно было оплатить до {due}. Если уже оплатили, спасибо, просто не обращайте внимания. {owner}",
    rem2: "Здравствуйте, {client}. Счёт {no} на {total} не оплачен уже {days} дн. Пожалуйста, переведите сумму до {deadline}. Спасибо! {owner}",
    rem3: "{client}, счёт {no} на {total} всё ещё не оплачен ({days} дн.), хотя я напоминал. Прошу оплатить до {deadline}, иначе придётся передать вопрос дальше. {owner}"
  },
  uk: {
    quote: "Кошторис", invoice: "Рахунок", no: "№", date: "Дата", valid: "Дійсний до", service_date: "Дата робіт", due: "Сплатити до",
    pos: "№", desc: "Робота", qty: "К-сть", unit_price: "Ціна", sum: "Сума",
    net: "Без ПДВ", vat: "ПДВ {rate} %", total: "Разом", per_month: "на місяць",
    small_note: "ПДВ не нараховується (§ 19 UStG, малий підприємець).",
    pay_note: "Будь ласка, перекажіть суму до {due} на рахунок нижче. Призначення платежу: {no}.",
    quote_note: "Кошторис дійсний до {valid}. Додаткові роботи за домовленістю.",
    send_quote: "Добрий день, {client}! Надсилаю кошторис {no} на {total}. Якщо є питання, пишіть. {owner}",
    send_invoice: "Добрий день, {client}! Надсилаю рахунок {no} на {total}, сплатити до {due}. Дякую за замовлення! {owner}",
    follow_quote: "Добрий день, {client}! Кошторис {no} дійшов? Можу притримати для вас дату. {owner}",
    rem1: "Добрий день, {client}! Нагадую: рахунок {no} на {total} треба було сплатити до {due}. Якщо вже сплатили, дякую, просто не зважайте. {owner}",
    rem2: "Добрий день, {client}. Рахунок {no} на {total} не сплачений уже {days} дн. Будь ласка, перекажіть суму до {deadline}. Дякую! {owner}",
    rem3: "{client}, рахунок {no} на {total} досі не сплачений ({days} дн.), хоча я нагадував. Прошу сплатити до {deadline}, інакше доведеться передати питання далі. {owner}"
  }
};

function dt(lang, key, vars) {
  var p = DOC_TEXTS[lang] || DOC_TEXTS.de;
  if (p[key] === undefined) throw new Error("no text " + key);
  return tpl(p[key], vars || {});
}

/* doc: {type: "quote"|"invoice", no, date, client, client_address, lang, service_date, calc} */
function docPlaceholders(cfg, doc) {
  var L = doc.lang || cfg.doc_lang || "de";
  var c = doc.calc;
  var b = cfg.business;
  var valid = dAdd(doc.date, cfg.quote_valid_days || 30);
  var due = dAdd(doc.date, cfg.pay_days || 14);
  var totalsLines = [];
  if (!c.small) {
    totalsLines.push(dt(L, "net") + ": " + money(c.net, L));
    totalsLines.push(dt(L, "vat", { rate: c.vat_rate }) + ": " + money(c.vat, L));
  }
  totalsLines.push(dt(L, "total") + ": " + money(c.total, L) + (c.monthly ? " " + dt(L, "per_month") : ""));
  var notes = [];
  if (c.small) notes.push(dt(L, "small_note"));
  if (doc.type === "invoice") notes.push(dt(L, "pay_note", { due: dShow(due, L), no: doc.no }));
  else notes.push(dt(L, "quote_note", { valid: dShow(valid, L) }));
  return {
    "{{title}}": dt(L, doc.type) + " " + doc.no,
    "{{biz_name}}": b.name, "{{biz_address}}": b.address || "", "{{biz_contact}}": b.contact || "",
    "{{biz_tax}}": b.vat_id ? "USt-IdNr. " + b.vat_id : (b.tax_no ? "Steuernummer " + b.tax_no : ""),
    "{{biz_bank}}": b.iban ? (b.bank_owner || b.name) + ", IBAN " + b.iban + (b.bic ? ", BIC " + b.bic : "") : "",
    "{{client}}": doc.client || "", "{{client_address}}": doc.client_address || "",
    "{{date_label}}": dt(L, "date"), "{{date}}": dShow(doc.date, L),
    "{{extra_label}}": doc.type === "invoice" ? dt(L, "service_date") : dt(L, "valid"),
    "{{extra}}": doc.type === "invoice" ? dShow(doc.service_date || doc.date, L) : dShow(valid, L),
    "{{totals}}": totalsLines.join("\n"),
    "{{notes}}": notes.join("\n"),
    "{{footer}}": cfg.footer || ""
  };
}

function tableRows(cfg, doc) {
  var L = doc.lang || cfg.doc_lang || "de";
  var head = [dt(L, "pos"), dt(L, "desc"), dt(L, "qty"), dt(L, "unit_price"), dt(L, "sum")];
  var rows = doc.calc.lines.map(function (l, i) {
    return [String(i + 1), l.text, String(r2(l.qty)).replace(".", L === "en" ? "." : ",") + (l.unit ? " " + l.unit : ""), money(l.price, L), money(l.sum, L)];
  });
  return [head].concat(rows);
}

/* §14 (4) UStG checklist for invoices. Kleinbetragsrechnung (§33 UStDV, total up to 250 € gross) needs less. */
function invoiceProblems(cfg, doc) {
  var p = [];
  var b = cfg.business || {};
  var small = doc.calc.total <= 250;
  if (!b.name || !b.address) p.push("seller name and address");
  if (!small && !b.tax_no && !b.vat_id) p.push("seller Steuernummer or USt-IdNr");
  if (!doc.no) p.push("invoice number");
  if (!doc.date) p.push("invoice date");
  if (!doc.client) p.push("buyer name");
  if (!small && !doc.client_address) p.push("buyer address");
  if (!doc.calc.lines.length) p.push("what was delivered");
  if (!small && !doc.service_date) p.push("service date (Leistungsdatum), can be the invoice date if same");
  return p;
}

/* Messages the owner sends from his own phone (wa.me link or copy). */
function messageFor(kind, cfg, row, today) {
  var L = row.lang || cfg.customer_lang || "de";
  var owner = cfg.business.sign || cfg.business.name;
  var v = { client: row.client, no: row.no, total: money(dnum(row.total), L), due: row.due ? dShow(row.due, L) : "",
    days: row.due ? Math.max(0, dDiff(row.due, today)) : 0, deadline: dShow(dAdd(today, 7), L), owner: owner };
  return dt(L, kind, v);
}

/* Which reminder (if any) fits an invoice today. Quotes get one follow-up after cfg.follow_days. */
function reminderStage(row, today, cfg) {
  var stages = (cfg && cfg.stages) || [1, 14, 28];
  if (row.type === "quote") {
    if (truthy(row.paid)) return null; // "paid" column = "accepted" for quotes
    return dDiff(row.date, today) >= ((cfg && cfg.follow_days) || 5) ? "follow_quote" : null;
  }
  if (truthy(row.paid) || !row.due) return null;
  var late = dDiff(row.due, today);
  var s = null;
  for (var i = 0; i < stages.length; i++) if (late >= stages[i]) s = "rem" + (i + 1);
  return s;
}

function waLinkD(phone, text, cc) {
  var s = String(phone || "").replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
  if (!s) return "";
  if (s.indexOf("+") === 0) s = s.slice(1);
  else if (s.indexOf("00") === 0) s = s.slice(2);
  else if (s.indexOf("0") === 0) s = String(cc || "49") + s.slice(1);
  return "https://wa.me/" + s + "?text=" + encodeURIComponent(text);
}

function validateDocsConfig(cfg) {
  var e = [];
  if (["items", "area", "lines", "manual"].indexOf(cfg.mode) < 0) e.push("mode must be items|area|lines|manual");
  if (!cfg.business || !cfg.business.name) e.push("business.name missing");
  if (DOC_LANGS.indexOf(cfg.doc_lang) < 0) e.push("doc_lang must be de|en|ru|uk");
  if (cfg.mode === "items" && !(cfg.prices && cfg.prices.length)) e.push("items mode needs prices");
  if (cfg.mode === "area" && !(cfg.area && cfg.area.rate_m2)) e.push("area mode needs area.rate_m2");
  if (!cfg.vat || ["regular", "small"].indexOf(cfg.vat.mode) < 0) e.push("vat.mode must be regular|small (ask the client or his tax advisor)");
  return e;
}
