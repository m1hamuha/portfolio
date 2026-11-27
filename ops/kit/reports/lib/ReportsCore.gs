/* reports kit: pure logic. Plain script, no imports, no network.
   The SAME file runs in Google Apps Script (next to apps-script/Reports.gs)
   and in node (test/ loads it with vm). Dates are "YYYY-MM-DD" strings or Date objects. */

var REPORT_LANGS = ["ru", "uk", "de", "en"];

/* ---------- small helpers ---------- */

/* "1.234,50" / "1,5" / "12.5" / 3 -> number. Empty -> 0. */
function num(x) {
  if (typeof x === "number") return isFinite(x) ? x : 0;
  if (x === null || x === undefined) return 0;
  var s = String(x).trim().replace(/\s|€|EUR/gi, "");
  if (!s) return 0;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function round2(n) { return Math.round(n * 100) / 100; }

/* Date | "2026-11-27" | "27.11.2026" -> "2026-11-27" */
function isoDate(d) {
  if (d instanceof Date || (d && typeof d.getFullYear === "function")) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  var s = String(d || "").trim();
  var de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (de) {
    var y = de[3].length === 2 ? "20" + de[3] : de[3];
    return y + "-" + ("0" + de[2]).slice(-2) + "-" + ("0" + de[1]).slice(-2);
  }
  var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  throw new Error("bad date: " + s);
}

function dayNum(d) { var p = isoDate(d).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
function addDays(d, n) { var t = new Date((dayNum(d) + n) * 86400000); return t.toISOString().slice(0, 10); }
function daysBetween(a, b) { return dayNum(b) - dayNum(a); }
function monthKey(d) { return isoDate(d).slice(0, 7); }
function prevMonthKey(mk) { var y = +mk.slice(0, 4), m = +mk.slice(5, 7) - 1; if (m === 0) { y--; m = 12; } return y + "-" + ("0" + m).slice(-2); }

/* Monday..Sunday of the week before `today` */
function lastWeek(today) {
  var t = isoDate(today);
  var dow = (new Date(dayNum(t) * 86400000).getUTCDay() + 6) % 7; // 0 = Monday
  var thisMonday = addDays(t, -dow);
  return { from: addDays(thisMonday, -7), to: addDays(thisMonday, -1) };
}

/* "07:30" | "7.30" | "7" -> minutes since midnight */
function hm(s) {
  if (typeof s === "number") return Math.round(s * 24 * 60); // sheet time value (fraction of day)
  if (s && typeof s.getHours === "function") return s.getHours() * 60 + s.getMinutes();
  var m = String(s || "").trim().match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
  if (!m) throw new Error("bad time: " + s);
  return +m[1] * 60 + (m[2] ? +m[2] : 0);
}

function fmtMoney(n, lang) {
  var v = round2(n).toFixed(2);
  var parts = v.split(".");
  var sep = lang === "en" ? "," : (lang === "de" ? "." : " ");
  var dec = lang === "en" ? "." : ",";
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  var out = parts[1] === "00" ? parts[0] : parts[0] + dec + parts[1];
  return out + " €";
}

function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] === undefined ? "{" + k + "}" : String(vars[k]); });
}

/* ---------- texts (owner-facing and customer-facing) ---------- */

var REPORT_TEXTS = {
  ru: {
    stock_line: "{name}: {used} {unit}, план {plan} {unit}, {cost}",
    stock_over: " (больше плана на {pct}%)",
    stock_head: "Расход за {from} - {to}",
    stock_total: "Итого расход: {total}",
    hours_head: "Часы за {from} - {to}",
    hours_job: "{job}: {workers} чел., {hours} ч",
    hours_late: "Внесено позже 7 дней: {n} записей (проверь)",
    reorder_head: "Что дозаказать ({date})",
    reorder_line: "{name}: осталось {stock}, за неделю ушло {sold7}, закажи {order}",
    slow_line: "{name}: {stock} шт., {days} дней без продаж, подумай о скидке",
    owes_line: "{cleaner}: взяла наличными {cash}, расходы {spent}, отдала {handed}, должна тебе {owes}",
    month_left: "{month}, осталось после всех расходов: {left}",
    one_in: "Пришло: {v}",
    one_out: "Ушло: {v}",
    one_left: "Осталось: {v}",
    one_more: " (на {d} больше, чем в прошлом месяце)",
    one_less: " (на {d} меньше, чем в прошлом месяце)",
    one_note: "Это обзор для тебя, не для налоговой.",
    rem1: "Здравствуйте, {client}! Напоминаю про счёт {no} на {amount} от {issued}. Срок оплаты был {due}. Если уже оплатили, спасибо, тогда это сообщение можно не читать. {owner}",
    rem2: "Здравствуйте, {client}. Счёт {no} на {amount} пока не оплачен, просрочка {days} дн. Пожалуйста, переведите сумму в ближайшие дни или напишите, если что-то не так со счётом. {owner}",
    rem3: "{client}, счёт {no} на {amount} просрочен на {days} дн. Прошу оплатить до {deadline}. Если оплата не придёт, мне придётся передать вопрос дальше. {owner}"
  },
  uk: {
    stock_line: "{name}: {used} {unit}, план {plan} {unit}, {cost}",
    stock_over: " (більше плану на {pct}%)",
    stock_head: "Витрата за {from} - {to}",
    stock_total: "Разом витрата: {total}",
    hours_head: "Години за {from} - {to}",
    hours_job: "{job}: {workers} ос., {hours} год",
    hours_late: "Внесено пізніше 7 днів: {n} записів (перевір)",
    reorder_head: "Що дозамовити ({date})",
    reorder_line: "{name}: залишилось {stock}, за тиждень продано {sold7}, замов {order}",
    slow_line: "{name}: {stock} шт., {days} днів без продажів, подумай про знижку",
    owes_line: "{cleaner}: взяла готівкою {cash}, витрати {spent}, віддала {handed}, винна тобі {owes}",
    month_left: "{month}, залишилось після всіх витрат: {left}",
    rem1: "Добрий день, {client}! Нагадую про рахунок {no} на {amount} від {issued}. Термін оплати був {due}. Якщо вже оплатили, дякую, тоді це повідомлення можна не читати. {owner}",
    rem2: "Добрий день, {client}. Рахунок {no} на {amount} поки не оплачений, прострочення {days} дн. Будь ласка, перекажіть суму найближчими днями або напишіть, якщо щось не так із рахунком. {owner}",
    rem3: "{client}, рахунок {no} на {amount} прострочений на {days} дн. Прошу оплатити до {deadline}. Якщо оплата не надійде, мені доведеться передати питання далі. {owner}",
    one_in: "Надійшло: {v}", one_out: "Витрачено: {v}", one_left: "Залишилось: {v}",
    one_more: " (на {d} більше, ніж минулого місяця)", one_less: " (на {d} менше, ніж минулого місяця)",
    one_note: "Це огляд для тебе, не для податкової."
  },
  de: {
    stock_line: "{name}: {used} {unit}, geplant {plan} {unit}, {cost}",
    stock_over: " ({pct}% über Plan)",
    stock_head: "Verbrauch {from} bis {to}",
    stock_total: "Verbrauch gesamt: {total}",
    hours_head: "Stunden {from} bis {to}",
    hours_job: "{job}: {workers} Pers., {hours} Std.",
    hours_late: "Später als 7 Tage eingetragen: {n} Einträge (bitte prüfen)",
    reorder_head: "Nachbestellen ({date})",
    reorder_line: "{name}: noch {stock}, letzte Woche {sold7} verkauft, bestelle {order}",
    slow_line: "{name}: {stock} Stück, {days} Tage ohne Verkauf, Rabatt überlegen",
    owes_line: "{cleaner}: bar kassiert {cash}, Ausgaben {spent}, abgegeben {handed}, schuldet dir {owes}",
    month_left: "{month}, nach allen Kosten übrig: {left}",
    one_in: "Eingang: {v}", one_out: "Ausgang: {v}", one_left: "Übrig: {v}",
    one_more: " ({d} mehr als im Vormonat)", one_less: " ({d} weniger als im Vormonat)",
    one_note: "Übersicht für dich, keine Buchhaltung.",
    rem1: "Guten Tag {client}, eine kurze Erinnerung an die Rechnung {no} über {amount} vom {issued}, fällig am {due}. Falls Sie schon bezahlt haben, vielen Dank und bitte ignorieren Sie diese Nachricht. {owner}",
    rem2: "Guten Tag {client}, die Rechnung {no} über {amount} ist seit {days} Tagen offen. Bitte überweisen Sie den Betrag in den nächsten Tagen oder melden Sie sich, falls etwas an der Rechnung nicht stimmt. {owner}",
    rem3: "Guten Tag {client}, die Rechnung {no} über {amount} ist seit {days} Tagen überfällig. Bitte zahlen Sie bis zum {deadline}. Danach muss ich weitere Schritte einleiten. {owner}"
  },
  en: {
    stock_line: "{name}: {used} {unit}, you planned {plan} {unit}, {cost}",
    stock_over: " ({pct}% over plan)",
    stock_head: "Usage {from} to {to}",
    stock_total: "Total usage: {total}",
    hours_head: "Hours {from} to {to}",
    hours_job: "{job}: {workers} workers, {hours} h",
    hours_late: "Entered more than 7 days late: {n} rows (check)",
    reorder_head: "Reorder list ({date})",
    reorder_line: "{name}: {stock} left, {sold7} sold last week, order {order}",
    slow_line: "{name}: {stock} in stock, no sale in {days} days, mark it down",
    owes_line: "{cleaner}: took {cash} cash, spent {spent}, handed over {handed}, owes you {owes}",
    month_left: "{month}, left after all costs: {left}",
    one_in: "Came in: {v}", one_out: "Went out: {v}", one_left: "Left: {v}",
    one_more: " ({d} more than last month)", one_less: " ({d} less than last month)",
    one_note: "An overview for you, not for taxes.",
    rem1: "Hi {client}, a quick reminder about invoice {no} for {amount} from {issued}, due on {due}. If you have already paid, thank you and please ignore this. {owner}",
    rem2: "Hi {client}, invoice {no} for {amount} is now {days} days overdue. Please transfer the amount in the next few days, or tell me if something is wrong with the invoice. {owner}",
    rem3: "Hi {client}, invoice {no} for {amount} is {days} days overdue. Please pay by {deadline}. After that I will have to take further steps. {owner}"
  }
};

function rt(lang, key, vars) {
  var pack = REPORT_TEXTS[lang] || {};
  var tpl = pack[key] !== undefined ? pack[key] : REPORT_TEXTS.en[key];
  if (tpl === undefined) throw new Error("no text " + key);
  return fill(tpl, vars || {});
}

/* ---------- cafe: closing counts -> weekly usage and cost ---------- */
/* items: [{id, name, unit, price, plan_week}]
   counts: [{date, item, left}]   (item = id or name, one row per item per closing)
   deliveries: [{date, item, qty}]
   usage(item) = stock at start + delivered in (from..to] - stock at end */
function stockUsage(items, counts, deliveries, from, to, opts) {
  opts = opts || {};
  var tol = opts.tolerance === undefined ? 0.1 : opts.tolerance;
  var keyOf = function (x) { return String(x).trim().toLowerCase(); };
  var byKey = {};
  items.forEach(function (it) { byKey[keyOf(it.id)] = it; byKey[keyOf(it.name)] = it; });
  var lastCountOnOrBefore = function (it, day) {
    var best = null;
    counts.forEach(function (c) {
      var ci = byKey[keyOf(c.item)];
      if (ci !== it) return;
      var d = isoDate(c.date);
      if (d <= day && (!best || d >= best.date)) best = { date: d, left: num(c.left) };
    });
    return best;
  };
  var out = [];
  var total = 0;
  items.forEach(function (it) {
    var start = lastCountOnOrBefore(it, addDays(from, -1));
    var end = lastCountOnOrBefore(it, to);
    if (!start || !end || end.date < from) { out.push({ id: it.id, name: it.name, unit: it.unit, missing: true }); return; }
    var delivered = 0;
    deliveries.forEach(function (dv) {
      if (byKey[keyOf(dv.item)] !== it) return;
      var d = isoDate(dv.date);
      if (d > start.date && d <= end.date) delivered += num(dv.qty);
    });
    var used = round2(start.left + delivered - end.left);
    var cost = round2(used * num(it.price));
    total += cost;
    var plan = num(it.plan_week);
    var over = plan > 0 && used > plan * (1 + tol);
    out.push({ id: it.id, name: it.name, unit: it.unit, used: used, plan: plan, cost: cost, delivered: delivered,
      over: over, pct: plan > 0 ? Math.round((used / plan - 1) * 100) : null, negative: used < 0 });
  });
  return { from: from, to: to, lines: out, total: round2(total) };
}

function stockReportText(rep, lang) {
  var lines = [rt(lang, "stock_head", rep)];
  rep.lines.forEach(function (l) {
    if (l.missing) { lines.push(l.name + ": ?"); return; }
    var s = rt(lang, "stock_line", { name: l.name, used: l.used, plan: l.plan, unit: l.unit || "", cost: fmtMoney(l.cost, lang) });
    if (l.over) s += rt(lang, "stock_over", { pct: l.pct });
    lines.push(s);
  });
  lines.push(rt(lang, "stock_total", { total: fmtMoney(rep.total, lang) }));
  return lines.join("\n");
}

/* ---------- trades: hours from the phone form ---------- */
/* rows: [{ts, worker, job, date, start, end, pause_min}] */
function hoursSummary(rows, from, to) {
  var jobs = {}, workers = {}, problems = [], late = 0;
  rows.forEach(function (r, i) {
    var d = isoDate(r.date);
    if (d < from || d > to) return;
    var s, e;
    try { s = hm(r.start); e = hm(r.end); } catch (err) { problems.push({ row: i, why: "time" }); return; }
    if (e <= s) e += 24 * 60; // night shift over midnight
    var mins = e - s - num(r.pause_min);
    if (mins <= 0 || mins > 16 * 60) { problems.push({ row: i, why: "length", mins: mins }); return; }
    var h = mins / 60;
    var job = String(r.job || "?").trim();
    var w = String(r.worker || "?").trim();
    jobs[job] = jobs[job] || { job: job, hours: 0, workers: {} };
    jobs[job].hours += h;
    jobs[job].workers[w] = (jobs[job].workers[w] || 0) + h;
    workers[w] = (workers[w] || 0) + h;
    if (r.ts && daysBetween(d, isoDate(r.ts)) > 7) late++; // MiLoG §17: record within 7 days
  });
  var jobList = Object.keys(jobs).sort().map(function (k) {
    var j = jobs[k];
    return { job: j.job, hours: round2(j.hours), workers: Object.keys(j.workers).length,
      by_worker: Object.keys(j.workers).sort().map(function (w) { return { worker: w, hours: round2(j.workers[w]) }; }) };
  });
  return { from: from, to: to, jobs: jobList,
    workers: Object.keys(workers).sort().map(function (w) { return { worker: w, hours: round2(workers[w]) }; }),
    total: round2(jobList.reduce(function (a, j) { return a + j.hours; }, 0)), late: late, problems: problems };
}

function hoursReportText(rep, lang) {
  var lines = [rt(lang, "hours_head", rep)];
  rep.jobs.forEach(function (j) { lines.push(rt(lang, "hours_job", j)); });
  if (rep.late) lines.push(rt(lang, "hours_late", { n: rep.late }));
  return lines.join("\n");
}

/* ---------- cleaning: who owes cash, what is left this month ---------- */
/* entries: [{date, cleaner, client, cash, spent, handed}]  (from the cleaners' phone form)
   other: {income: [{date, amount}], costs: [{date, amount, what}]} (owner types bank income, rent etc.)
   cfg: {wages: {name: monthly}, fixed: [{what, amount}]} */
function cashLedger(entries, monthK, cfg, other) {
  cfg = cfg || {}; other = other || {};
  var per = {}, cashIn = 0, supplies = 0;
  entries.forEach(function (e) {
    var name = String(e.cleaner || "?").trim();
    per[name] = per[name] || { cleaner: name, cash: 0, spent: 0, handed: 0 };
    // what is owed is cumulative over all months; month figures only count this month
    per[name].cash += num(e.cash); per[name].spent += num(e.spent); per[name].handed += num(e.handed);
    if (monthKey(e.date) === monthK) { cashIn += num(e.cash); supplies += num(e.spent); }
  });
  var people = Object.keys(per).sort().map(function (k) {
    var p = per[k];
    return { cleaner: p.cleaner, cash: round2(p.cash), spent: round2(p.spent), handed: round2(p.handed), owes: round2(p.cash - p.spent - p.handed) };
  });
  var bankIn = (other.income || []).filter(function (x) { return monthKey(x.date) === monthK; }).reduce(function (a, x) { return a + num(x.amount); }, 0);
  var extra = (other.costs || []).filter(function (x) { return monthKey(x.date) === monthK; }).reduce(function (a, x) { return a + num(x.amount); }, 0);
  var wages = Object.keys(cfg.wages || {}).reduce(function (a, k) { return a + num(cfg.wages[k]); }, 0);
  var fixed = (cfg.fixed || []).reduce(function (a, f) { return a + num(f.amount); }, 0);
  var income = cashIn + bankIn;
  var costs = supplies + extra + wages + fixed;
  return { month: monthK, people: people, income: round2(income), costs: round2(costs),
    parts: { cash: round2(cashIn), bank: round2(bankIn), supplies: round2(supplies), wages: round2(wages), fixed: round2(fixed), extra: round2(extra) },
    left: round2(income - costs) };
}

function ledgerText(led, lang) {
  var lines = led.people.map(function (p) {
    return rt(lang, "owes_line", { cleaner: p.cleaner, cash: fmtMoney(p.cash, lang), spent: fmtMoney(p.spent, lang), handed: fmtMoney(p.handed, lang), owes: fmtMoney(p.owes, lang) });
  });
  lines.push(rt(lang, "month_left", { month: led.month, left: fmtMoney(led.left, lang) }));
  return lines.join("\n");
}

/* ---------- office: who owes money, what still comes in ---------- */
/* invoices: [{no, client, phone, email, lang, amount, issued, due, paid}] */
function receivables(invoices, today, opts) {
  opts = opts || {};
  var t = isoDate(today);
  var mk = monthKey(t);
  var stages = opts.stages || [1, 14, 28]; // days overdue when reminder 1/2/3 is due
  var rows = invoices.map(function (inv) {
    var paid = inv.paid === true || String(inv.paid).toLowerCase() === "true";
    var due = isoDate(inv.due);
    var late = paid ? 0 : Math.max(0, daysBetween(due, t));
    var stage = 0;
    if (!paid) for (var i = 0; i < stages.length; i++) if (late >= stages[i]) stage = i + 1;
    return { no: inv.no, client: inv.client, amount: num(inv.amount), due: due, issued: inv.issued ? isoDate(inv.issued) : "",
      paid: paid, late: late, overdue: !paid && late > 0, stage: stage, lang: inv.lang || opts.lang || "de", phone: inv.phone || "" };
  });
  var open = rows.filter(function (r) { return !r.paid; });
  return {
    today: t, rows: rows,
    open_total: round2(open.reduce(function (a, r) { return a + r.amount; }, 0)),
    overdue_total: round2(open.filter(function (r) { return r.overdue; }).reduce(function (a, r) { return a + r.amount; }, 0)),
    due_this_month: round2(open.filter(function (r) { return !r.overdue && monthKey(r.due) === mk; }).reduce(function (a, r) { return a + r.amount; }, 0))
  };
}

function reminderText(row, owner, today, lang) {
  lang = lang || row.lang || "de";
  if (!row.stage) return "";
  return rt(lang, "rem" + row.stage, {
    client: row.client, no: row.no, amount: fmtMoney(row.amount, lang), issued: row.issued || "", due: row.due,
    days: row.late, deadline: addDays(today, 7), owner: owner || ""
  }).trim();
}

/* wa.me link with the text prefilled. The OWNER taps it and sends from his own WhatsApp. */
function waLink(phone, text, defaultCountry) {
  var s = String(phone || "").replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
  if (s.indexOf("+") === 0) s = s.slice(1);
  else if (s.indexOf("00") === 0) s = s.slice(2);
  else if (s.indexOf("0") === 0 && defaultCountry) s = String(defaultCountry) + s.slice(1);
  return "https://wa.me/" + s + "?text=" + encodeURIComponent(text);
}

/* ---------- shop: what sold, what sits, what to reorder ---------- */
/* items: [{sku, name, stock, supplier, pack, cover_days, min}]  stock = current (from till or counted)
   sales: [{date, sku, qty}] */
function reorderList(items, sales, today, cfg) {
  cfg = cfg || {};
  var t = isoDate(today);
  var slowDays = cfg.slow_days || 90;
  var stat = {};
  sales.forEach(function (s) {
    var k = String(s.sku);
    var d = isoDate(s.date);
    var age = daysBetween(d, t);
    if (age < 0) return;
    stat[k] = stat[k] || { s7: 0, s28: 0, last: null };
    if (age <= 7 && age >= 1) stat[k].s7 += num(s.qty);
    if (age <= 28 && age >= 1) stat[k].s28 += num(s.qty);
    if (!stat[k].last || d > stat[k].last) stat[k].last = d;
  });
  var reorder = [], slow = [];
  items.forEach(function (it) {
    var st = stat[String(it.sku)] || { s7: 0, s28: 0, last: null };
    var stock = num(it.stock);
    var daily = Math.max(st.s7 / 7, st.s28 / 28);
    var cover = num(it.cover_days) || cfg.cover_days || 14;
    var need = Math.ceil(daily * cover - stock);
    var min = num(it.min);
    if (min && stock < min) need = Math.max(need, Math.ceil(min * 2 - stock));
    var pack = num(it.pack) || 1;
    if (need > 0) {
      var order = Math.ceil(need / pack) * pack;
      reorder.push({ sku: it.sku, name: it.name, supplier: it.supplier || "", stock: stock, sold7: st.s7, sold28: st.s28, order: order });
    }
    var since = st.last ? daysBetween(st.last, t) : null;
    if (stock > 0 && (since === null || since >= slowDays)) slow.push({ sku: it.sku, name: it.name, stock: stock, days: since === null ? slowDays + "+" : since });
  });
  reorder.sort(function (a, b) { return (a.supplier + a.name).localeCompare(b.supplier + b.name); });
  return { date: t, reorder: reorder, slow: slow };
}

function reorderText(r, lang) {
  var lines = [rt(lang, "reorder_head", r)];
  var sup = null;
  r.reorder.forEach(function (x) {
    if (x.supplier !== sup) { sup = x.supplier; if (sup) lines.push("", "[" + sup + "]"); }
    lines.push(rt(lang, "reorder_line", x));
  });
  if (r.slow.length) lines.push("");
  r.slow.forEach(function (x) { lines.push(rt(lang, "slow_line", x)); });
  return lines.join("\n");
}

/* Till export CSV -> rows. map = {date: "Datum", sku: "Artikelnummer", qty: "Menge"} (header names) */
function parseCsv(text, delimiter) {
  text = String(text).replace(/^﻿/, "");
  var first = text.split(/\r?\n/)[0] || "";
  var d = delimiter || ([";", ",", "\t"].map(function (c) { return [c, first.split(c).length]; }).sort(function (a, b) { return b[1] - a[1]; })[0][0]);
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === d) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvToObjects(text, map, delimiter) {
  var rows = parseCsv(text, delimiter);
  if (!rows.length) return [];
  var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
  var idx = {};
  Object.keys(map).forEach(function (k) {
    var want = [].concat(map[k]).map(function (h) { return String(h).toLowerCase(); });
    var at = -1;
    want.forEach(function (w) { if (at < 0) at = head.indexOf(w); });
    if (at < 0) throw new Error("column not found: " + want.join(" | "));
    idx[k] = at;
  });
  return rows.slice(1).map(function (r) {
    var o = {};
    Object.keys(idx).forEach(function (k) { o[k] = (r[idx[k]] || "").trim(); });
    return o;
  });
}

/* ---------- other: bank statement -> one page a month ---------- */
/* rules: [{cat: "rent", any: ["miete", "hausverwaltung"]}, ...] matched against payee + purpose, lower case.
   tx: [{date, amount (+ in, - out), payee, purpose}] */
function categorize(tx, rules, fallbackIn, fallbackOut) {
  return tx.map(function (t) {
    var hay = (String(t.payee || "") + " " + String(t.purpose || "")).toLowerCase();
    var amt = num(t.amount);
    var cat = null;
    for (var i = 0; i < rules.length && !cat; i++) {
      var r = rules[i];
      if (r.sign === "in" && amt < 0) continue;
      if (r.sign === "out" && amt > 0) continue;
      if ((r.any || []).some(function (w) { return hay.indexOf(String(w).toLowerCase()) >= 0; })) cat = r.cat;
    }
    return { date: isoDate(t.date), amount: amt, payee: t.payee || "", purpose: t.purpose || "", cat: cat || (amt >= 0 ? (fallbackIn || "income") : (fallbackOut || "other")) , guessed: !cat };
  });
}

function monthSummary(txc, mk) {
  var pm = prevMonthKey(mk);
  var sum = function (m) {
    var s = { in: 0, out: 0, cats: {} };
    txc.forEach(function (t) {
      if (monthKey(t.date) !== m) return;
      if (t.cat === "transfer") return; // own transfers between accounts are not income or cost
      if (t.amount >= 0) s.in += t.amount; else s.out += -t.amount;
      if (t.amount < 0) s.cats[t.cat] = (s.cats[t.cat] || 0) + -t.amount;
    });
    return s;
  };
  var cur = sum(mk), prev = sum(pm);
  var cats = Object.keys(cur.cats).sort(function (a, b) { return cur.cats[b] - cur.cats[a]; }).map(function (c) {
    return { cat: c, amount: round2(cur.cats[c]), prev: round2(prev.cats[c] || 0), delta: round2(cur.cats[c] - (prev.cats[c] || 0)) };
  });
  var unsorted = txc.filter(function (t) { return monthKey(t.date) === mk && t.guessed; }).length;
  return { month: mk, in: round2(cur.in), out: round2(cur.out), left: round2(cur.in - cur.out), cats: cats, unsorted: unsorted, has_prev: prev.in + prev.out > 0 };
}

/* catNames: {rent: "Аренда", ...}; flags a category when it moved by >= 20% and >= 20 € vs last month */
function onePageText(sm, lang, catNames, title) {
  catNames = catNames || {};
  var L = function (k, v) { return rt(lang, k, v); };
  var lines = [];
  if (title) lines.push(title + " " + sm.month);
  lines.push(L("one_in", { v: fmtMoney(sm.in, lang) }));
  lines.push(L("one_out", { v: fmtMoney(sm.out, lang) }));
  lines.push(L("one_left", { v: fmtMoney(sm.left, lang) }));
  lines.push("");
  sm.cats.forEach(function (c) {
    var s = (catNames[c.cat] || c.cat) + ": " + fmtMoney(c.amount, lang);
    if (sm.has_prev && Math.abs(c.delta) >= 20 && (c.prev === 0 || Math.abs(c.delta) / c.prev >= 0.2)) {
      s += L(c.delta > 0 ? "one_more" : "one_less", { d: fmtMoney(Math.abs(c.delta), lang) });
    }
    lines.push(s);
  });
  lines.push("", L("one_note", {}));
  return lines.join("\n");
}

/* config check used by setup and tests */
function validateReportConfig(cfg) {
  var errs = [];
  var kinds = ["stock", "hours", "cash", "receivables", "reorder", "monthly"];
  if (kinds.indexOf(cfg.kind) < 0) errs.push("kind must be one of " + kinds.join(", "));
  if (!cfg.business || !cfg.business.name) errs.push("business.name missing");
  if (REPORT_LANGS.indexOf(cfg.lang) < 0) errs.push("lang must be ru|uk|de|en");
  if (cfg.kind === "stock" && !(cfg.items && cfg.items.length)) errs.push("stock needs items");
  if (cfg.kind === "stock" && cfg.items && cfg.items.length > 15) errs.push("stock: keep the closing form short (max 15 items)");
  if (cfg.kind === "hours" && !(cfg.jobs && cfg.jobs.length)) errs.push("hours needs jobs (sites)");
  if (cfg.kind === "cash" && !(cfg.cleaners && cfg.cleaners.length)) errs.push("cash needs cleaners");
  if (cfg.kind === "reorder" && !cfg.till) errs.push("reorder needs till");
  if (cfg.kind === "monthly" && !(cfg.rules && cfg.rules.length)) errs.push("monthly needs rules");
  if (cfg.owner_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cfg.owner_email)) errs.push("owner_email looks wrong");
  return errs;
}

/* Tills that do not send stock: stock = last count - sold since the count + received since the count.
   items: [{sku, counted, counted_at}], receipts: [{date, sku, qty}] */
function stockFromCount(items, sales, receipts) {
  return items.map(function (it) {
    if (it.counted_at === undefined || it.counted_at === "" || it.counted === undefined || it.counted === "") return it;
    var since = isoDate(it.counted_at);
    var sold = 0, got = 0;
    sales.forEach(function (s) { if (String(s.sku) === String(it.sku) && isoDate(s.date) > since) sold += num(s.qty); });
    (receipts || []).forEach(function (r) { if (String(r.sku) === String(it.sku) && isoDate(r.date) > since) got += num(r.qty); });
    var copy = {};
    Object.keys(it).forEach(function (k) { copy[k] = it[k]; });
    copy.stock = num(it.counted) - sold + got;
    return copy;
  });
}

/* Zettle purchases JSON -> sales rows. Field names per Zettle Purchase API v2 docs (not re-checked live, see README). */
function zettleToSales(json) {
  var out = [];
  ((json && json.purchases) || []).forEach(function (p) {
    if (p.refund) return;
    var uuid = p.purchaseUUID1 || p.purchaseUUID || "";
    (p.products || []).forEach(function (pr, i) {
      out.push({ date: isoDate(String(p.timestamp).slice(0, 10)), sku: pr.sku || pr.name, qty: num(pr.quantity), id: uuid ? uuid + "#" + i : "" });
    });
  });
  return out;
}
