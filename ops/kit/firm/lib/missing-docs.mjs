/* Missing documents: reminders ready. Reads the checklist sheet (one row per case) and prepares reminder
   DRAFTS for what is still missing. A person reads and sends them (Gmail or Outlook draft); nothing is sent here.
   Row: { case: "2026-014", name: "Frau Beispiel", email, lang: "de", needed: ["Lohnsteuerbescheinigung", ...],
          received: [...], lastReminder: "2026-11-01" }
   Options: { everyDays: 7, maxReminders: 3, firm: "Kanzlei Beispiel" }
   Privacy: the draft lists only document names, the subject uses the case number; no model is needed. */

const T = {
  de: { subj: (c) => `Unterlagen für Vorgang ${c}`, hi: (n) => (n ? `Guten Tag ${n},` : "Guten Tag,"), body: "für Ihren Vorgang fehlen uns noch:", end: "Sie können die Unterlagen einfach auf diese E-Mail antworten oder über das Upload-Formular schicken. Vielen Dank!", bye: "Viele Grüße" },
  en: { subj: (c) => `Documents for case ${c}`, hi: (n) => (n ? `Hello ${n},` : "Hello,"), body: "we still need these documents for your case:", end: "You can send them back with this e-mail or through the upload form. Thank you!", bye: "Kind regards" },
  uk: { subj: (c) => `Документи до справи ${c}`, hi: (n) => (n ? `Добрий день, ${n}!` : "Добрий день!"), body: "для вашої справи нам ще бракує:", end: "Документи можна надіслати у відповідь на цей лист або через форму завантаження. Дякуємо!", bye: "З повагою" },
  ru: { subj: (c) => `Документы по делу ${c}`, hi: (n) => (n ? `Добрый день, ${n}!` : "Добрый день!"), body: "для вашего дела нам ещё не хватает:", end: "Документы можно прислать ответом на это письмо или через форму загрузки. Спасибо!", bye: "С уважением" },
};

const day = 864e5;
export function missing(row) {
  const got = new Set((row.received || []).map((s) => s.trim().toLowerCase()));
  return (row.needed || []).filter((d) => !got.has(d.trim().toLowerCase()));
}

export function drafts(rows, { today = new Date(), everyDays = 7, maxReminders = 3, firm = "" } = {}) {
  const out = [];
  for (const r of rows) {
    const miss = missing(r);
    if (!miss.length || !r.email) continue;
    if ((r.reminders || 0) >= maxReminders) { out.push({ case: r.case, skip: "max reminders, call the client" }); continue; }
    if (r.lastReminder && (today - new Date(r.lastReminder)) / day < everyDays) continue;
    const t = T[r.lang] || T.de;
    out.push({
      case: r.case, to: r.email, subject: t.subj(r.case),
      body: [t.hi(r.name), "", t.body, ...miss.map((m) => `- ${m}`), "", t.end, "", t.bye, firm].filter((x) => x !== undefined).join("\n").trim(),
      missing: miss,
    });
  }
  return out;
}

/* Call after a person has sent the draft: updates the row so the interval and the 3-reminder limit hold. */
export function markSent(row, today = new Date()) {
  return { ...row, lastReminder: today.toISOString().slice(0, 10), reminders: (row.reminders || 0) + 1 };
}
