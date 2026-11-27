/* UI words of the one-page site in 4 languages. Business texts come from business.json. */
export const LANGS = ["de", "en", "ru", "uk"];

export const UI = {
  de: {
    call: "Anrufen", whatsapp: "WhatsApp", directions: "Route", book: "Probetraining buchen", prices: "Preise", hours: "Öffnungszeiten",
    photos: "Fotos", area: "Wir kommen nach", contact: "Kontakt", from: "ab", openNow: "Jetzt geöffnet", closedNow: "Jetzt geschlossen",
    openUntil: "Geöffnet bis", closed: "geschlossen", days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    name: "Name", phone: "Telefon", slot: "Wunschtermin", message: "Nachricht (optional)", send: "Senden",
    consent: "Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden. Mehr in der", privacy: "Datenschutzerklärung",
    imprint: "Impressum", thanks: "Danke! Wir melden uns bald.", error: "Das hat nicht geklappt. Bitte rufen Sie uns an.",
    pricesNote: "Preise inkl. MwSt.", lang: "Sprache", address: "Adresse",
  },
  en: {
    call: "Call", whatsapp: "WhatsApp", directions: "Directions", book: "Book a free trial", prices: "Prices", hours: "Opening hours",
    photos: "Photos", area: "We work in", contact: "Contact", from: "from", openNow: "Open now", closedNow: "Closed now",
    openUntil: "Open until", closed: "closed", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    name: "Name", phone: "Phone", slot: "Preferred time", message: "Message (optional)", send: "Send",
    consent: "I agree that my details are stored to handle my request. More in the", privacy: "privacy policy",
    imprint: "Legal notice", thanks: "Thank you! We will get back to you soon.", error: "That did not work. Please call us.",
    pricesNote: "Prices include VAT.", lang: "Language", address: "Address",
  },
  ru: {
    call: "Позвонить", whatsapp: "WhatsApp", directions: "Маршрут", book: "Записаться на пробное", prices: "Цены", hours: "Часы работы",
    photos: "Фото", area: "Где работаем", contact: "Контакты", from: "от", openNow: "Сейчас открыто", closedNow: "Сейчас закрыто",
    openUntil: "Открыто до", closed: "закрыто", days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
    name: "Имя", phone: "Телефон", slot: "Удобное время", message: "Сообщение (по желанию)", send: "Отправить",
    consent: "Я согласен(на), что мои данные сохранят для ответа на заявку. Подробнее в", privacy: "политике конфиденциальности",
    imprint: "Impressum", thanks: "Спасибо! Скоро свяжемся.", error: "Не получилось. Пожалуйста, позвоните нам.",
    pricesNote: "Цены с НДС.", lang: "Язык", address: "Адрес",
  },
  uk: {
    call: "Зателефонувати", whatsapp: "WhatsApp", directions: "Маршрут", book: "Записатися на пробне", prices: "Ціни", hours: "Години роботи",
    photos: "Фото", area: "Де працюємо", contact: "Контакти", from: "від", openNow: "Зараз відчинено", closedNow: "Зараз зачинено",
    openUntil: "Відчинено до", closed: "зачинено", days: ["Понеділок", "Вівторок", "Середа", "Четвер", "Пʼятниця", "Субота", "Неділя"],
    name: "Імʼя", phone: "Телефон", slot: "Зручний час", message: "Повідомлення (за бажанням)", send: "Надіслати",
    consent: "Я погоджуюсь, що мої дані збережуть для відповіді на заявку. Докладніше в", privacy: "політиці конфіденційності",
    imprint: "Impressum", thanks: "Дякуємо! Незабаром звʼяжемося.", error: "Не вдалося. Будь ласка, зателефонуйте нам.",
    pricesNote: "Ціни з ПДВ.", lang: "Мова", address: "Адреса",
  },
};

/* "de" | {de:"..", ru:".."} -> string in lang, falling back to the default language, then to any value */
export function t(v, lang, fallback) {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return v[lang] ?? v[fallback] ?? Object.values(v)[0] ?? "";
}
