/**
 * Message texts in ru, uk, de, en.
 * Placeholders: {name} {business} {date} {weekday} {time} {link} {items} {unsub} {phone}
 * A client's business.json can override any text: "texts": { "reminder_day_before": { "de": "..." } }
 * Kinds ending in _subject are e-mail subjects.
 * WhatsApp to customers outside the 24h window can ONLY use templates approved by Meta
 * (see ../whatsapp-templates). These texts are used for e-mail, SMS and the "assist" mode
 * (owner taps a wa.me link and sends from his own phone).
 */
var TEXTS = {
  reminder_day_before: {
    ru: "{name}, здравствуйте! Напоминаем: завтра, {weekday} {date}, в {time} вас ждёт {business}. Не сможете? Просто ответьте на это сообщение.",
    uk: "{name}, вітаємо! Нагадуємо: завтра, {weekday} {date}, о {time} на вас чекає {business}. Не зможете? Просто дайте відповідь на це повідомлення.",
    de: "Hallo {name}, kurze Erinnerung von {business}: morgen, {weekday} {date}, um {time} Uhr. Sie können nicht? Antworten Sie einfach auf diese Nachricht.",
    en: "Hi {name}, a reminder from {business}: tomorrow, {weekday} {date}, at {time}. Can't make it? Just reply to this message."
  },
  reminder_same_day: {
    ru: "{name}, здравствуйте! Ждём вас сегодня в {time}, {business}. Если планы изменились, ответьте НЕТ.",
    uk: "{name}, вітаємо! Чекаємо на вас сьогодні о {time}, {business}. Якщо плани змінилися, дайте відповідь НІ.",
    de: "Hallo {name}, wir erwarten Sie heute um {time} Uhr, {business}. Falls sich etwas geändert hat, antworten Sie NEIN.",
    en: "Hi {name}, see you today at {time}, {business}. If plans changed, reply NO."
  },
  visit_day_before_subject: {
    ru: "{business}: визит завтра в {time}",
    uk: "{business}: візит завтра о {time}",
    de: "{business}: Termin morgen um {time} Uhr",
    en: "{business}: visit tomorrow at {time}"
  },
  visit_day_before: {
    ru: "{name}, здравствуйте!\n\n{business} приедет к вам завтра, {weekday} {date}, в {time}.\nПодтвердить или выбрать другое время: {link}\n\nСпасибо!",
    uk: "{name}, вітаємо!\n\n{business} приїде до вас завтра, {weekday} {date}, о {time}.\nПідтвердити або обрати інший час: {link}\n\nДякуємо!",
    de: "Hallo {name},\n\n{business} kommt morgen, {weekday} {date}, um {time} Uhr zu Ihnen.\nBestätigen oder andere Zeit wählen: {link}\n\nVielen Dank!",
    en: "Hi {name},\n\n{business} comes to you tomorrow, {weekday} {date}, at {time}.\nTap to confirm or move it: {link}\n\nThank you!"
  },
  visit_day_before_sms: {
    ru: "{business}: завтра {date} в {time} приедем к вам. Подтвердить или перенести: {link}",
    uk: "{business}: завтра {date} о {time} приїдемо до вас. Підтвердити або перенести: {link}",
    de: "{business}: morgen {date} um {time} Uhr sind wir bei Ihnen. Bestätigen/verschieben: {link}",
    en: "{business}: we come tomorrow {date} at {time}. Confirm or move: {link}"
  },
  comeback: {
    ru: "{name}, здравствуйте! Давно вас не было в {business}. Записать вас на удобный день? Напишите, когда удобно.",
    uk: "{name}, вітаємо! Давно вас не було в {business}. Записати вас на зручний день? Напишіть, коли зручно.",
    de: "Hallo {name}, lange nicht gesehen bei {business}! Sollen wir einen Termin für Sie eintragen? Schreiben Sie uns einfach, wann es passt.",
    en: "Hi {name}, long time no see at {business}. Shall we book you in? Just tell us a day that suits you."
  },
  comeback_subject: {
    ru: "{business}: давно не виделись",
    uk: "{business}: давно не бачились",
    de: "{business}: lange nicht gesehen",
    en: "{business}: long time no see"
  },
  rebook_subject: {
    ru: "{business}: пора снова убраться?",
    uk: "{business}: час знову прибрати?",
    de: "{business}: Zeit für die nächste Reinigung?",
    en: "{business}: time for the next cleaning?"
  },
  rebook: {
    ru: "{name}, здравствуйте!\n\nПрошло 4 недели с нашей последней уборки. Приехать снова? Ответьте на это письмо и напишите удобный день.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nМинуло 4 тижні з нашого останнього прибирання. Приїхати знову? Дайте відповідь на цей лист і напишіть зручний день.\n\nЗ повагою,\n{business}",
    de: "Hallo {name},\n\nunsere letzte Reinigung bei Ihnen ist 4 Wochen her. Sollen wir wiederkommen? Antworten Sie einfach auf diese E-Mail mit einem passenden Tag.\n\nViele Grüße\n{business}",
    en: "Hi {name},\n\nit's been 4 weeks since we cleaned for you. Shall we come again? Just reply to this email with a day that suits you.\n\nBest regards,\n{business}"
  },
  checkup_subject: {
    ru: "{business}: пора на ежегодный осмотр",
    uk: "{business}: час на щорічний огляд",
    de: "{business}: Zeit für die jährliche Wartung",
    en: "{business}: time for the yearly check-up"
  },
  checkup: {
    ru: "{name}, здравствуйте!\n\nПрошёл почти год с нашего визита. Запланировать ежегодный осмотр? Ответьте на это письмо, и мы предложим время.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nМинув майже рік з нашого візиту. Запланувати щорічний огляд? Дайте відповідь на цей лист, і ми запропонуємо час.\n\nЗ повагою,\n{business}",
    de: "Hallo {name},\n\nunser letzter Besuch bei Ihnen ist fast ein Jahr her. Sollen wir die jährliche Wartung einplanen? Antworten Sie einfach auf diese E-Mail, wir schlagen einen Termin vor.\n\nViele Grüße\n{business}",
    en: "Hi {name},\n\nit's almost a year since our last visit. Shall we plan the yearly check-up? Just reply to this email and we'll suggest a time.\n\nBest regards,\n{business}"
  },
  docs_subject: {
    ru: "{business}: не хватает документов",
    uk: "{business}: бракує документів",
    de: "{business}: fehlende Unterlagen",
    en: "{business}: missing documents"
  },
  docs_1: {
    ru: "{name}, здравствуйте!\n\nЧтобы продолжить работу, нам ещё нужны:\n{items}\n\nПросто ответьте на это письмо и приложите файлы. Спасибо!\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nЩоб продовжити роботу, нам ще потрібні:\n{items}\n\nПросто дайте відповідь на цей лист і додайте файли. Дякуємо!\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\nfür die weitere Bearbeitung fehlen uns noch:\n{items}\n\nAntworten Sie einfach auf diese E-Mail und hängen Sie die Dateien an. Vielen Dank!\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\nto continue we still need:\n{items}\n\nJust reply to this email with the files attached. Thank you!\n\nBest regards,\n{business}"
  },
  docs_2: {
    ru: "{name}, здравствуйте!\n\nВежливо напоминаем: всё ещё не хватает\n{items}\n\nЕсли уже отправили, просто игнорируйте это письмо.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nВвічливо нагадуємо: досі бракує\n{items}\n\nЯкщо вже надіслали, просто проігноруйте цей лист.\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\neine freundliche Erinnerung: Es fehlen weiterhin\n{items}\n\nFalls Sie die Unterlagen schon geschickt haben, betrachten Sie diese E-Mail als erledigt.\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\na friendly reminder: we are still missing\n{items}\n\nIf you have already sent them, please ignore this email.\n\nBest regards,\n{business}"
  },
  docs_3: {
    ru: "{name}, здравствуйте!\n\nБез этих документов мы не сможем закончить работу в срок:\n{items}\n\nПожалуйста, пришлите их в ближайшие дни или позвоните нам.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nБез цих документів ми не зможемо завершити роботу вчасно:\n{items}\n\nБудь ласка, надішліть їх найближчими днями або зателефонуйте нам.\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\nohne diese Unterlagen können wir die Arbeit nicht fristgerecht abschließen:\n{items}\n\nBitte senden Sie sie in den nächsten Tagen oder rufen Sie uns an.\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\nwithout these documents we cannot finish on time:\n{items}\n\nPlease send them in the next few days or give us a call.\n\nBest regards,\n{business}"
  },
  pay_subject: {
    ru: "{business}: напоминание об оплате",
    uk: "{business}: нагадування про оплату",
    de: "{business}: Zahlungserinnerung",
    en: "{business}: payment reminder"
  },
  pay_1: {
    ru: "{name}, здравствуйте!\n\nВозможно, это ускользнуло от внимания: ещё не оплачено\n{items}\n\nЕсли уже оплатили, спасибо и просто игнорируйте письмо.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nМожливо, це залишилося поза увагою: ще не сплачено\n{items}\n\nЯкщо вже сплатили, дякуємо, просто проігноруйте лист.\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\nvielleicht ist es untergegangen: noch offen ist\n{items}\n\nFalls Sie bereits bezahlt haben, vielen Dank, dann ist diese E-Mail erledigt.\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\nperhaps this slipped through: still open is\n{items}\n\nIf you have already paid, thank you and please ignore this email.\n\nBest regards,\n{business}"
  },
  pay_2: {
    ru: "{name}, здравствуйте!\n\nПовторно напоминаем об оплате:\n{items}\n\nЕсли есть вопросы по счёту, ответьте на это письмо.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nПовторно нагадуємо про оплату:\n{items}\n\nЯкщо є питання щодо рахунку, дайте відповідь на цей лист.\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\nwir erinnern nochmals an die Zahlung:\n{items}\n\nBei Fragen zur Rechnung antworten Sie einfach auf diese E-Mail.\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\nanother reminder about the payment:\n{items}\n\nIf you have questions about the invoice, just reply to this email.\n\nBest regards,\n{business}"
  },
  pay_3: {
    ru: "{name}, здравствуйте!\n\nСчёт всё ещё не оплачен:\n{items}\n\nПожалуйста, оплатите в ближайшие 7 дней или свяжитесь с нами.\n\nС уважением,\n{business}",
    uk: "{name}, вітаємо!\n\nРахунок досі не сплачено:\n{items}\n\nБудь ласка, сплатіть протягом 7 днів або зв'яжіться з нами.\n\nЗ повагою,\n{business}",
    de: "Guten Tag {name},\n\ndie Rechnung ist weiterhin offen:\n{items}\n\nBitte begleichen Sie sie innerhalb von 7 Tagen oder melden Sie sich bei uns.\n\nMit freundlichen Grüßen\n{business}",
    en: "Hello {name},\n\nthe invoice is still open:\n{items}\n\nPlease pay within 7 days or get in touch with us.\n\nBest regards,\n{business}"
  },
  unsub_footer: {
    ru: "\n\nНе хотите больше таких писем? Отписаться: {unsub}",
    uk: "\n\nНе хочете більше таких листів? Відписатися: {unsub}",
    de: "\n\nKeine solchen E-Mails mehr? Abmelden: {unsub}",
    en: "\n\nDon't want these emails? Unsubscribe: {unsub}"
  },
  digest_subject: {
    ru: "Кому написать сегодня: {count}",
    uk: "Кому написати сьогодні: {count}",
    de: "Heute zu schreiben: {count}",
    en: "To message today: {count}"
  },
  owner_move: {
    ru: "{name} просит перенести визит {date} {time}. Выбрал(а): {items}. Перенеси в календаре и подтверди клиенту.",
    uk: "{name} просить перенести візит {date} {time}. Обрав(ла): {items}. Перенеси в календарі та підтвердь клієнту.",
    de: "{name} möchte den Termin {date} {time} verschieben. Gewählt: {items}. Bitte im Kalender verschieben und dem Kunden bestätigen.",
    en: "{name} wants to move the visit {date} {time}. Picked: {items}. Move it in the calendar and confirm to the client."
  },
  owner_confirm: {
    ru: "{name} подтвердил(а) визит {date} {time}.",
    uk: "{name} підтвердив(ла) візит {date} {time}.",
    de: "{name} hat den Termin {date} {time} bestätigt.",
    en: "{name} confirmed the visit {date} {time}."
  },
  page_confirmed: {
    ru: "Спасибо, визит подтверждён.", uk: "Дякуємо, візит підтверджено.",
    de: "Danke, der Termin ist bestätigt.", en: "Thank you, the visit is confirmed."
  },
  page_pick: {
    ru: "Выберите удобное время. Мы подтвердим перенос.", uk: "Оберіть зручний час. Ми підтвердимо перенесення.",
    de: "Wählen Sie eine passende Zeit. Wir bestätigen die Verschiebung.", en: "Pick a time that suits you. We will confirm the change."
  },
  page_moved: {
    ru: "Спасибо! Мы получили ваш выбор и подтвердим перенос.", uk: "Дякуємо! Ми отримали ваш вибір і підтвердимо перенесення.",
    de: "Danke! Wir haben Ihre Wahl erhalten und bestätigen die Verschiebung.", en: "Thanks! We got your choice and will confirm the change."
  },
  page_unsub: {
    ru: "Готово, больше писем не будет.", uk: "Готово, листів більше не буде.",
    de: "Erledigt, Sie erhalten keine solchen E-Mails mehr.", en: "Done, you will not get these emails any more."
  },
  page_unsub_btn: { ru: "Отписаться от писем", uk: "Відписатися від листів", de: "Keine E-Mails mehr erhalten", en: "Unsubscribe" },
  page_confirm_btn: { ru: "Подтвердить", uk: "Підтвердити", de: "Bestätigen", en: "Confirm" },
  page_other: { ru: "Другое время: напишите нам", uk: "Інший час: напишіть нам", de: "Andere Zeit: schreiben Sie uns", en: "Other time: write to us" }
};

var WEEKDAYS = {
  ru: ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"],
  uk: ["понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота", "неділя"],
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};
var MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
