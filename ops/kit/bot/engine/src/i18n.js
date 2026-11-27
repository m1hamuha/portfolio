/* Fixed texts the engine sends itself (the model never writes times, bookings or hand-overs).
   Four languages: ru, uk, de, en. "Sie"/"вы" form, short, no emoji, no long dashes.
   A business can override any key in business.json -> texts.<lang>.<key>. */

const T = {
  en: {
    disclosure: "(Automatic assistant of {name}. A person reads the chat later.)",
    offer: "Free times:\n{list}\nReply with the number of the time that suits you.",
    no_slots: "There are no free times in the next days. I passed your request on, you will get an answer soon.",
    which_service: "Which service would you like? {list}",
    ask_name: "Under what name shall I book it?",
    booked: "Done: {service}, {when}. See you at {name}!",
    booked_call: "Done: call on {when}. {name} will call you at the number you gave.",
    slot_taken: "This time was just taken. Other free times:\n{list}\nReply with the number.",
    link: "You can pick a free time here: {link}",
    request_taken: "Thank you, your request is noted: {summary}. We will confirm the time in the morning.",
    handover: "I will check this and get back to you. {owner_hours}",
    health: "I cannot answer questions about health or treatment in this chat. The practice will answer you personally. For urgent problems call 112 or the out-of-hours service 116117.",
    table_ok: "Your table is booked: {people} people, {when}, name {guest}. See you!",
    table_full: "Sorry, at {when} all tables are taken. Free times that day: {list}",
    table_need: "To book a table please send: day, time, number of people and a name.",
    nontext: "Please write your question as text, I cannot open files or voice messages. A person will look at them later.",
    error: "Sorry, something went wrong. A person will answer you soon.",
  },
  de: {
    disclosure: "(Automatischer Assistent von {name}. Ein Mensch liest den Chat später.)",
    offer: "Freie Termine:\n{list}\nAntworten Sie mit der Nummer des passenden Termins.",
    no_slots: "In den nächsten Tagen ist kein Termin frei. Ich habe Ihre Anfrage weitergegeben, Sie bekommen bald eine Antwort.",
    which_service: "Welche Leistung möchten Sie? {list}",
    ask_name: "Auf welchen Namen darf ich buchen?",
    booked: "Gebucht: {service}, {when}. Bis bald bei {name}!",
    booked_call: "Gebucht: Anruf am {when}. {name} ruft Sie unter der angegebenen Nummer an.",
    slot_taken: "Dieser Termin wurde gerade vergeben. Weitere freie Termine:\n{list}\nAntworten Sie mit der Nummer.",
    link: "Hier können Sie einen freien Termin wählen: {link}",
    request_taken: "Danke, Ihre Anfrage ist notiert: {summary}. Wir bestätigen die Uhrzeit am Morgen.",
    handover: "Das kläre ich und melde mich bei Ihnen. {owner_hours}",
    health: "Fragen zu Gesundheit oder Behandlung kann ich in diesem Chat nicht beantworten. Die Praxis antwortet Ihnen persönlich. Bei dringenden Beschwerden: 112 oder ärztlicher Bereitschaftsdienst 116117.",
    table_ok: "Ihr Tisch ist reserviert: {people} Personen, {when}, Name {guest}. Bis bald!",
    table_full: "Leider sind um {when} alle Tische belegt. Freie Zeiten an diesem Tag: {list}",
    table_need: "Für eine Reservierung schreiben Sie bitte: Tag, Uhrzeit, Personenzahl und Namen.",
    nontext: "Bitte schreiben Sie Ihre Frage als Text, Dateien und Sprachnachrichten kann ich nicht öffnen. Ein Mensch sieht sie sich später an.",
    error: "Entschuldigung, etwas ist schiefgelaufen. Ein Mensch antwortet Ihnen bald.",
  },
  ru: {
    disclosure: "(Автоматический помощник {name}. Человек прочитает чат позже.)",
    offer: "Свободное время:\n{list}\nОтветьте номером подходящего времени.",
    no_slots: "В ближайшие дни свободного времени нет. Я передал ваш запрос, вам скоро ответят.",
    which_service: "Какая услуга вам нужна? {list}",
    ask_name: "На чьё имя записать?",
    booked: "Готово: {service}, {when}. Ждём вас в {name}!",
    booked_call: "Готово: звонок {when}. {name} позвонит вам по указанному номеру.",
    slot_taken: "Это время только что заняли. Другое свободное время:\n{list}\nОтветьте номером.",
    link: "Свободное время можно выбрать здесь: {link}",
    request_taken: "Спасибо, ваш запрос записан: {summary}. Время подтвердим утром.",
    handover: "Я уточню и вернусь к вам. {owner_hours}",
    health: "На вопросы о здоровье и лечении я в этом чате не отвечаю. Вам ответят в практике лично. При срочных жалобах звоните 112 или в дежурную службу 116117.",
    table_ok: "Столик забронирован: {people} чел., {when}, на имя {guest}. Ждём вас!",
    table_full: "К сожалению, на {when} все столики заняты. Свободно в этот день: {list}",
    table_need: "Для брони напишите: день, время, сколько человек и имя.",
    nontext: "Пожалуйста, напишите вопрос текстом, файлы и голосовые я не открываю. Человек посмотрит их позже.",
    error: "Извините, что-то пошло не так. Вам скоро ответит человек.",
  },
  uk: {
    disclosure: "(Автоматичний помічник {name}. Людина прочитає чат пізніше.)",
    offer: "Вільний час:\n{list}\nВідповідайте номером зручного часу.",
    no_slots: "Найближчими днями вільного часу немає. Я передав ваш запит, вам скоро відповідять.",
    which_service: "Яка послуга вам потрібна? {list}",
    ask_name: "На яке ім'я записати?",
    booked: "Готово: {service}, {when}. Чекаємо на вас у {name}!",
    booked_call: "Готово: дзвінок {when}. {name} зателефонує вам за вказаним номером.",
    slot_taken: "Цей час щойно зайняли. Інший вільний час:\n{list}\nВідповідайте номером.",
    link: "Вільний час можна обрати тут: {link}",
    request_taken: "Дякуємо, ваш запит записано: {summary}. Час підтвердимо вранці.",
    handover: "Я уточню і повернуся до вас. {owner_hours}",
    health: "На питання про здоров'я та лікування я в цьому чаті не відповідаю. Вам відповідять у практиці особисто. У термінових випадках телефонуйте 112 або 116117.",
    table_ok: "Столик заброньовано: {people} осіб, {when}, на ім'я {guest}. Чекаємо на вас!",
    table_full: "На жаль, на {when} усі столики зайняті. Вільно цього дня: {list}",
    table_need: "Для бронювання напишіть: день, час, кількість осіб та ім'я.",
    nontext: "Будь ласка, напишіть питання текстом, файли та голосові я не відкриваю. Людина подивиться їх пізніше.",
    error: "Вибачте, щось пішло не так. Вам скоро відповість людина.",
  },
};

export const LANGS = Object.keys(T);

export function t(biz, lang, key, vars = {}) {
  const l = T[lang] ? lang : biz.default_lang || "en";
  const own = biz.texts && biz.texts[l] && biz.texts[l][key];
  const tpl = own || T[l][key] || T.en[key] || key;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : k === "name" ? biz.name : ""))
    .replace(/[\u2013\u2014]/g, "-").replace(/\s+\n/g, "\n").trim();
}

/* cheap fallback when the model gives no language */
export function guessLang(text, biz) {
  const s = String(text || "");
  if (/[іїєґ]/i.test(s)) return pick("uk", biz);
  if (/[а-яё]/i.test(s)) return pick("ru", biz);
  if (/[äöüß]|\b(ich|und|nicht|bitte|termin|hallo|guten)\b/i.test(s)) return pick("de", biz);
  if (/\b(the|hello|hi|please|price|book|how)\b/i.test(s)) return pick("en", biz);
  return biz.default_lang || "en";
}
function pick(l, biz) { return (biz.languages || LANGS).includes(l) ? l : biz.default_lang || "en"; }
