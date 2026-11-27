/* hiring kit: pure logic. Plain script, no imports, no network.
   Runs in Google Apps Script (next to apps-script/Hiring.gs) and in node (bin/ and test/ load it with vm). */

var HIRE_LANGS = ["de", "en", "ru", "uk"];

/* ---------- question library: short, job-related, allowed under AGG and GDPR ---------- */
/* type: text | para | choice | date. "opts" are per language. Never ask age, photo, gender, origin, religion,
   family, pregnancy, health, union membership. File upload is not used: in Google Forms it forces a Google login. */
var Q_LIB = {
  name:       { type: "text", req: true,  de: "Vor- und Nachname", en: "First and last name", ru: "Имя и фамилия", uk: "Ім'я та прізвище" },
  phone:      { type: "text", req: true,  de: "Telefon oder WhatsApp", en: "Phone or WhatsApp", ru: "Телефон или WhatsApp", uk: "Телефон або WhatsApp" },
  email:      { type: "text", req: false, de: "E-Mail (optional)", en: "Email (optional)", ru: "Почта (необязательно)", uk: "Пошта (необов'язково)" },
  start:      { type: "date", req: true,  de: "Ab wann kannst du anfangen?", en: "When can you start?", ru: "С какого дня можешь начать?", uk: "З якого дня можеш почати?" },
  hours:      { type: "choice", req: true, de: "Passen die Arbeitszeiten ({shift})?", en: "Do the hours fit you ({shift})?", ru: "Подходит график ({shift})?", uk: "Підходить графік ({shift})?",
                opts: { de: ["Ja", "Teilweise", "Nein"], en: ["Yes", "Partly", "No"], ru: ["Да", "Частично", "Нет"], uk: ["Так", "Частково", "Ні"] } },
  weekends:   { type: "choice", req: true, de: "Kannst du am Wochenende arbeiten?", en: "Can you work weekends?", ru: "Можешь работать в выходные?", uk: "Можеш працювати у вихідні?",
                opts: { de: ["Ja", "Nur Samstag", "Nein"], en: ["Yes", "Saturday only", "No"], ru: ["Да", "Только суббота", "Нет"], uk: ["Так", "Лише субота", "Ні"] } },
  experience: { type: "choice", req: true, de: "Erfahrung in dieser Arbeit", en: "Experience in this work", ru: "Опыт в этой работе", uk: "Досвід у цій роботі",
                opts: { de: ["Keine", "Unter 1 Jahr", "1 bis 3 Jahre", "Über 3 Jahre"], en: ["None", "Under 1 year", "1 to 3 years", "Over 3 years"], ru: ["Нет", "Меньше года", "1-3 года", "Больше 3 лет"], uk: ["Немає", "Менше року", "1-3 роки", "Понад 3 роки"] } },
  area:       { type: "text", req: true,  de: "Wo wohnst du ungefähr? (Stadtteil oder PLZ)", en: "Roughly where do you live? (area or postcode)", ru: "Где примерно живёшь? (район или индекс)", uk: "Де приблизно живеш? (район або індекс)" },
  certificate:{ type: "choice", req: true, de: "Hast du die nötige Ausbildung / Lizenz ({cert})?", en: "Do you have the required training / licence ({cert})?", ru: "Есть нужное обучение / лицензия ({cert})?", uk: "Є потрібне навчання / ліцензія ({cert})?",
                opts: { de: ["Ja", "In Arbeit", "Nein"], en: ["Yes", "In progress", "No"], ru: ["Да", "В процессе", "Нет"], uk: ["Так", "В процесі", "Ні"] } },
  tools:      { type: "choice", req: true, de: "Hast du eigenes Werkzeug?", en: "Do you have your own tools?", ru: "Есть свой инструмент?", uk: "Є свій інструмент?",
                opts: { de: ["Ja", "Teilweise", "Nein"], en: ["Yes", "Some", "No"], ru: ["Да", "Частично", "Нет"], uk: ["Так", "Частково", "Ні"] } },
  licence:    { type: "choice", req: true, de: "Führerschein Klasse B (für diese Stelle nötig)?", en: "Driving licence class B (needed for this job)?", ru: "Права категории B (нужны для этой работы)?", uk: "Права категорії B (потрібні для цієї роботи)?",
                opts: { de: ["Ja", "Nein"], en: ["Yes", "No"], ru: ["Да", "Нет"], uk: ["Так", "Ні"] } },
  german:     { type: "choice", req: true, de: "Deutsch für die Arbeit mit Kunden", en: "German for work with customers", ru: "Немецкий для работы с клиентами", uk: "Німецька для роботи з клієнтами",
                opts: { de: ["Gut", "Reicht für einfache Gespräche", "Noch nicht"], en: ["Good", "Enough for simple talk", "Not yet"], ru: ["Хорошо", "Хватает для простых разговоров", "Пока нет"], uk: ["Добре", "Вистачає для простих розмов", "Поки ні"] } },
  permit:     { type: "choice", req: true, de: "Darfst du in Deutschland arbeiten?", en: "Are you allowed to work in Germany?", ru: "Есть право работать в Германии?", uk: "Маєш право працювати в Німеччині?",
                opts: { de: ["Ja", "Nein / unklar"], en: ["Yes", "No / not sure"], ru: ["Да", "Нет / не уверен(а)"], uk: ["Так", "Ні / не впевнений(а)"] } },
  work_link:  { type: "text", req: false, de: "Link zu Fotos oder Video deiner Arbeit (optional, z. B. Instagram, Google Drive)", en: "Link to photos or a video of your work (optional, e.g. Instagram, Google Drive)",
                ru: "Ссылка на фото или видео работ (необязательно, например Instagram, Google Drive)", uk: "Посилання на фото або відео робіт (необов'язково, наприклад Instagram, Google Drive)" },
  about:      { type: "para", req: false, de: "Ein, zwei Sätze über dich", en: "One or two lines about you", ru: "Пара слов о себе", uk: "Кілька слів про себе" },
  consent:    { type: "choice", req: true, de: "Datenschutz: Ich habe den Hinweis oben gelesen.", en: "Privacy: I have read the notice above.", ru: "Конфиденциальность: я прочитал(а) текст выше.", uk: "Конфіденційність: я прочитав(ла) текст вище.",
                opts: { de: ["Ja"], en: ["Yes"], ru: ["Да"], uk: ["Так"] } }
};

function fillH(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] === undefined ? "" : String(v[k]); }); }

/* cfg.form: {lang, questions: [ids], shift, cert}. Returns the concrete form (titles in the form language). */
function buildFormSpec(cfg) {
  var L = cfg.form.lang || "de";
  var ids = cfg.form.questions.slice();
  ["phone", "name"].forEach(function (k) { if (ids.indexOf(k) < 0) ids.unshift(k); });
  if (ids.indexOf("consent") < 0) ids.push("consent");
  return {
    title: cfg.job.title_de ? cfg.job.title_de + " | " + cfg.business.name : cfg.business.name,
    description: privacyNotice(cfg, L),
    confirmation: { de: "Danke! Wir melden uns innerhalb einer Woche.", en: "Thank you! We will get back to you within a week.", ru: "Спасибо! Мы ответим в течение недели.", uk: "Дякуємо! Ми відповімо протягом тижня." }[L],
    items: ids.map(function (id) {
      var q = Q_LIB[id];
      if (!q) throw new Error("unknown question " + id);
      return { id: id, type: q.type, required: !!q.req, title: fillH(q[L], { shift: cfg.form.shift || "", cert: cfg.form.cert || "" }), options: q.opts ? q.opts[L] : null };
    })
  };
}

/* Art. 13 GDPR short notice. The full text belongs in the employer's own privacy page (link). */
function privacyNotice(cfg, L) {
  var b = cfg.business;
  var months = cfg.retention_months || 6;
  var t = {
    de: "Verantwortlich: {name}, {addr}. Wir nutzen deine Angaben nur für diese Bewerbung (Art. 6 Abs. 1 b DSGVO). Gespeichert in Google (Google Forms / Sheets) höchstens {m} Monate ab Eingang, dann automatisch gelöscht. Du kannst Auskunft, Berichtigung und Löschung verlangen: {contact}. Bitte keine Angaben zu Gesundheit, Religion oder Herkunft und kein Foto.{more}",
    en: "Controller: {name}, {addr}. We use your answers only for this application (Art. 6(1)(b) GDPR). Stored in Google (Forms / Sheets) for at most {m} months after you send them, then deleted automatically. You can ask for access, correction and deletion: {contact}. Please do not send health, religion or origin details or a photo.{more}",
    ru: "Ответственный: {name}, {addr}. Ответы используем только для этой вакансии (ст. 6 п. 1 b GDPR). Хранятся в Google (Forms / Sheets) не дольше {m} мес. с момента отправки, потом удаляются автоматически. Можно запросить, исправить или удалить свои данные: {contact}. Не пиши о здоровье, религии, происхождении и не присылай фото.{more}",
    uk: "Відповідальний: {name}, {addr}. Відповіді використовуємо лише для цієї вакансії (ст. 6 п. 1 b GDPR). Зберігаються в Google (Forms / Sheets) не довше {m} міс. з моменту надсилання, потім видаляються автоматично. Можна запитати, виправити або видалити свої дані: {contact}. Не пиши про здоров'я, релігію, походження і не надсилай фото.{more}"
  }[L];
  return fillH(t, { name: b.name, addr: b.address || "", m: months, contact: b.privacy_contact || b.contact || "", more: b.privacy_url ? " " + b.privacy_url : "" });
}

/* Flags questions or custom texts that ask for protected or excessive data. */
var BAD_QUESTION = [
  { re: /\b(alter\b|wie alt|age\b|how old|geburts|birth)|возраст|дата рожд|скільки років|вік\b|дата народж/i, why: "age / birth date (AGG)" },
  { re: /\b(foto von dir|bewerbungsfoto|lichtbild|photo of you|your photo|selfie)|фото себя|своё фото|твоё фото|твоє фото|своє фото/i, why: "photo of the person (AGG risk, not needed)" },
  { re: /\b(geschlecht|gender)\b|ваш пол|твой пол|стать\b/i, why: "gender (AGG)" },
  { re: /\b(nationalit|herkunft|origin|staatsangeh)|гражданств|национальн|громадянств|походжен/i, why: "origin / nationality (AGG); ask 'allowed to work in Germany' instead" },
  { re: /\b(religi|konfession)|религи|релігі|вероисп/i, why: "religion (AGG)" },
  { re: /\b(verheiratet|married|kinder|children|schwanger|pregnan)|замуж|женат|дети|беремен|діти|вагітн/i, why: "family / pregnancy (AGG)" },
  { re: /\b(gesundheit|krankheit|behinder|health|disab)|здоров|инвалид|болезн|хвороб|інвалідн/i, why: "health / disability (AGG, Art. 9 GDPR)" },
  { re: /\b(gewerkschaft|trade union)|профсоюз|профспілк/i, why: "union membership (Art. 9 GDPR)" },
  { re: /muttersprach|native speaker|носител|носій/i, why: "native speaker (indirect origin discrimination); ask for the level needed instead" }
];

function lintQuestions(spec) {
  var out = [];
  spec.items.forEach(function (it) {
    if (it.type === "file") out.push({ id: it.id, why: "file upload forces a Google login in Google Forms; ask for a link or WhatsApp instead" });
    BAD_QUESTION.forEach(function (b) { if (b.re.test(it.title)) out.push({ id: it.id, why: b.why }); });
  });
  if (spec.items.filter(function (i) { return i.id !== "consent"; }).length > 9) out.push({ id: "*", why: "too long: keep it under 2 minutes (max ~8 questions)" });
  return out;
}

/* ---------- job ad text checks (AGG neutral) ---------- */
var AD_RULES = [
  { lvl: "error", re: /\bjung(e|en|es|er)?\b|\byoung\b|молод|юная|юный|юні|молод/i, why: "age wording (jung / young). Say what the job needs instead" },
  { lvl: "error", re: /\b(max(imal)?\.?\s*\d{2}\s*jahre|bis \d{2} jahre|zwischen \d{2} und \d{2}|under \d{2}|aged? \d{2})/i, why: "age limit" },
  { lvl: "error", re: /muttersprach|native speaker|носител|носій/i, why: "native speaker: ask for the language level the job needs" },
  { lvl: "error", re: /\b(lichtbild|bewerbungsfoto|mit foto|with (a )?photo|фото себя)\b/i, why: "photo request" },
  { lvl: "error", re: /\b(nur frauen|nur männer|women only|men only|только женщин|только мужчин)\b/i, why: "gender restriction" },
  { lvl: "error", re: /\b(deutsche staatsangehörigkeit|german citizens? only|только граждан)/i, why: "nationality requirement; use 'work permit for Germany'" },
  { lvl: "warn",  re: /\b(digital native|berufseinsteiger(in)?|frisch|dynamisch(es|en)? team|fresh graduate)\b/i, why: "can read as age preference; consider removing" },
  { lvl: "warn",  re: /\bbelastbar|stressresistent\b/i, why: "vague; describe the real workload instead" }
];

/* German job titles need a neutral form: (m/w/d), (w/m/d), (m/w/x), *in, :in. */
function aggLint(text, lang) {
  var issues = [];
  AD_RULES.forEach(function (r) { var m = String(text).match(r.re); if (m) issues.push({ level: r.lvl, why: r.why, match: m[0] }); });
  if (lang === "de") {
    var first = String(text).split("\n").filter(function (l) { return l.trim(); })[0] || "";
    if (!/\((m|w|d|x)\s*\/\s*(m|w|d|x)\s*\/\s*(m|w|d|x)\)|\*in\b|:in\b|\/-?in\b/i.test(first)) issues.push({ level: "error", why: "German title line needs (m/w/d) or a neutral form", match: first.slice(0, 60) });
    if (/\b(kellnerin|putzfrau|verkäuferin|sekretärin|arzthelferin)\b/i.test(text) && !/\((m|w|d)\/(m|w|d)\/(m|w|d)\)/i.test(text)) issues.push({ level: "error", why: "female-only job title", match: "" });
  }
  return issues;
}

/* ---------- prompt for the ad (LLM call happens in bin/job-ad.mjs, provider swappable) ---------- */
function buildAdRequest(brief) {
  var langs = brief.langs && brief.langs.length ? brief.langs : ["de"];
  var lines = [
    "Business: " + brief.business.name + " (" + brief.niche + "), " + (brief.business.city || ""),
    "Job: " + brief.job.title,
    "Hours: " + brief.job.hours,
    "Pay: " + brief.job.pay,
    "Contract: " + (brief.job.contract || "not stated"),
    "Start: " + (brief.job.start || "as soon as possible"),
    "Tasks: " + (brief.job.tasks || []).join("; "),
    "Must have (only real job needs): " + (brief.job.must || []).join("; "),
    "Nice to have: " + (brief.job.nice || []).join("; "),
    "What the team offers: " + (brief.job.offer || []).join("; "),
    "What went wrong last time (avoid attracting this): " + (brief.job.last_time || "-"),
    "Apply via: the short form at {{FORM_LINK}} (2 minutes, no CV needed)",
    "Languages to write: " + langs.join(", ")
  ];
  return {
    user: lines.join("\n"),
    langs: langs,
    max_words: brief.max_words || 140
  };
}

/* model returns JSON {"ads": {"de": "...", "ru": "..."}, "title_de": "..."} */
function parseAdJson(text) {
  var s = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  var a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("model did not return JSON");
  var j = JSON.parse(s.slice(a, b + 1));
  if (!j.ads || typeof j.ads !== "object") throw new Error("JSON has no ads");
  return j;
}

/* ---------- answers: who fits ---------- */
/* rules: [{q: "weekends", in: ["Ja", "Nur Samstag"]}, {q: "start", within_days: 30}, {q: "certificate", in: ["Ja"]}] */
function fitCheck(answers, rules, today) {
  var why = [];
  (rules || []).forEach(function (r) {
    var v = answers[r.q];
    if (r.in && r.in.indexOf(String(v || "").trim()) < 0) why.push(r.q + ": " + (v || "-"));
    if (r.within_days) {
      var d = v && typeof v.getFullYear === "function" ? v.toISOString().slice(0, 10) : String(v || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) why.push(r.q + ": ?");
      else {
        var diff = (Date.parse(d) - Date.parse(today)) / 86400000;
        if (diff > r.within_days) why.push(r.q + ": " + d);
      }
    }
  });
  return { fits: why.length === 0, why: why };
}

function candidateMail(cfg, spec, answers, fit) {
  var L = cfg.owner_lang || "ru";
  var head = { ru: ["Подходит", "Не подходит"], uk: ["Підходить", "Не підходить"], de: ["Passt", "Passt nicht"], en: ["Fits", "Does not fit"] }[L];
  var subject = (fit.fits ? head[0] : head[1]) + ": " + (answers.name || "?") + " | " + (cfg.job.title_de || cfg.job.title);
  var body = spec.items.filter(function (i) { return i.id !== "consent"; }).map(function (i) {
    var v = answers[i.id];
    if (v && typeof v.getFullYear === "function") v = v.toISOString().slice(0, 10);
    return i.title + ": " + (v === undefined || v === "" ? "-" : v);
  });
  if (!fit.fits) body.push("", "(" + fit.why.join(", ") + ")");
  return { subject: subject, body: body.join("\n") };
}

/* rows older than N months after submit are due for deletion (default 6: AGG claim period 2 months + reserve) */
function retentionCutoff(today, months) {
  var d = new Date(Date.parse(today));
  d.setUTCMonth(d.getUTCMonth() - (months || 6));
  return d.toISOString().slice(0, 10);
}

function validateHiringConfig(cfg) {
  var e = [];
  if (!cfg.business || !cfg.business.name) e.push("business.name missing");
  if (!cfg.business || !(cfg.business.privacy_contact || cfg.business.contact)) e.push("business.privacy_contact missing (GDPR notice)");
  if (!cfg.job || !cfg.job.title) e.push("job.title missing");
  if (!cfg.form || HIRE_LANGS.indexOf(cfg.form.lang) < 0) e.push("form.lang must be de|en|ru|uk");
  if (cfg.form && cfg.form.questions) cfg.form.questions.forEach(function (q) { if (!Q_LIB[q]) e.push("unknown question " + q); });
  if (cfg.form && cfg.form.questions && cfg.form.questions.length > 8) e.push("max 8 questions (2 minutes)");
  if ((cfg.form && cfg.form.questions || []).indexOf("hours") >= 0 && !cfg.form.shift) e.push("hours question needs form.shift");
  if ((cfg.form && cfg.form.questions || []).indexOf("certificate") >= 0 && !cfg.form.cert) e.push("certificate question needs form.cert");
  if (!cfg.notify || ["email", "none"].indexOf(cfg.notify.mode) < 0) e.push("notify.mode must be email|none");
  if (cfg.notify && cfg.notify.mode === "email" && !cfg.notify.to) e.push("notify.to missing");
  return e;
}
