# leads: все заявки в одном списке на телефоне

Цена на сайте: €29 разово. У clinic и other отмечены сторонние расходы.
Всё проверено 27.11.2026. Что не удалось проверить первоисточником, помечено словом «не проверено».

Состав набора:

- `apps-script/` - Google Apps Script в таблице клиента: забирает заявки из почты, принимает заявки от Worker и формы сайта, сортирует список, шлёт уведомление в Telegram или на почту, утренняя сводка.
- `worker/` - Cloudflare Worker (один на клиента): форма сайта, вебхуки Meta (Instagram, Facebook, WhatsApp Cloud API), Telegram-бот для бизнес-чатов. Пересылает заявку строкой в таблицу.
- `site-form/form.html` - готовая форма для сайта клиента (с ловушкой для ботов и галочкой согласия).
- `config/*.example.json` - примеры для всех 6 ниш (вымышленные данные).
- `test/` - офлайн-тесты: `node --test ops/kit/leads/test/*.test.mjs` (15 тестов, все проходят, сеть замокана).

## 1. Что именно получает клиент

| Ниша | Обещание на сайте (ru) | Что делаю по факту |
|---|---|---|
| trades | «Заявки с почты и сайта сами попадают в одну таблицу в твоём телефоне, остальные письма не трогаются» | Каждые 5 минут скрипт ищет в Gmail письма по фильтру (письма формы сайта, слова «Anfrage», «Angebot» и т.п.), пишет строку и ставит только ярлык «Leads». Письма не перемещаются, не помечаются прочитанными. Звонки и WhatsApp мастер добавляет через Google Форму «быстрая заявка» с телефона (10 секунд) или прямо в таблицу. Сверху «без ответа с четверга», «смета отправлена 5 дн. назад, перезвонить». |
| cleaning | «Заявки с сайта и почты сами собираются в один список» | То же. Строка: имя, телефон, что нужно, какой день. Ссылка на таблицу на рабочем столе телефона. |
| office | «Кто написал тебе с сайта или на почту, сразу приходит сообщением на телефон» | То же плюс бот Telegram: «Neue Anfrage (Website): Anna Klein, Laden, braucht Buchhaltung, +49171...». Почта проверяется раз в 5 минут, форма через Worker приходит за секунды. |
| clinic | «Сообщения новых пациентов с сайта, почты и Facebook в одной таблице в телефоне» | Сайт и почта как выше. Уведомление администратору без содержания: «Neue Anfrage (Website). Liste öffnen: ссылка». Таблица в Google Workspace практики, доступ только врачу и администратору, удаление закрытых строк через 90 дней. Facebook только после одобрения Meta (см. 7 и 8). |
| fitness | «Все заявки из Instagram, WhatsApp и почты в одном списке» | Почта автоматически. Instagram автоматически только после App Review у Meta или через платный сервис. WhatsApp автоматически только при номере на Cloud API. Без этого: Instagram и WhatsApp добавляются через «быструю заявку» за 10 секунд. Ссылка «Открыть» ведёт в чат (wa.me, ig.me). Галочка «Готово» уводит строку вниз. |
| other | «Все сообщения клиентов из WhatsApp, Telegram и почты в одном списке» | Telegram: бот, подключённый к Telegram Business аккаунта владельца, видит личные чаты с клиентами. Почта: все входящие, кроме рассылок, по желанию с фильтром ИИ. WhatsApp: только при номере на Cloud API с coexistence у партнёра (платно). Список в приложении Google Таблицы. |

## 2. Стек

- Google Таблица клиента + привязанный Apps Script (бесплатно). Лист «Leads», колонки: Готово, Что сделать, Пришла, Откуда, Имя, Контакт, Что нужно, Когда, Открыть, Этап, Дата этапа. Две служебные колонки скрыты.
- Почта: Gmail клиента, поиск по фильтру `email.query`, ярлык `Leads`. Если почта не Gmail (например IONOS, Strato): включить в старой почте пересылку на отдельный Gmail клиента или переадресацию только адреса формы.
- Форма сайта: если сайт уже шлёт письма (WordPress, Wix, Jimdo), их разбирает скрипт по строкам «Name: ...». Если можно вставить свой HTML, лучше `site-form/form.html` на Worker: быстрее и без парсинга.
- Cloudflare Worker (бесплатный тариф Workers; лимит 100 000 запросов в день по документации Cloudflare, отдельно сегодня не проверял). Секреты через `wrangler secret put`.
- Уведомления: Telegram-бот клиента (создаётся у @BotFather на его аккаунте) и/или письмо на его почту (приходит пушем Gmail).
- Instagram, Facebook: приложение Meta клиента, вебхук на Worker `/meta`.
- WhatsApp: Cloud API, вебхук на Worker `/meta`; номер через партнёра с coexistence (см. `../mail/README.md`, раздел 3).
- Telegram: бот + Telegram Business «Чат-боты» в настройках аккаунта владельца, вебхук на Worker `/telegram`.
- ИИ (по желанию, по умолчанию выключен): Anthropic Messages API, модель `claude-haiku-5-5`. В Apps Script: решить, заявка ли это письмо, и вписать «что хочет» в 8 словах. В Worker: краткая строка «что хочет» для длинных сообщений. Провайдер меняется одной функцией (`LLM_PROVIDERS` в LeadsCore.gs, `PROVIDERS` в worker/index.js). Для клиник отключён принудительно (`health: true`, `HEALTH=1`).

## 3. Один раз подготовить (Михаил)

1. Мастер-таблица с файлами из `apps-script/`, как в mail: на клиента «Файл > Создать копию», свойства скрипта заново.
2. Google Форма «Быстрая заявка» в мастер-таблице (Инструменты > Создать форму): вопросы «Откуда» (варианты Телефон, WhatsApp, Instagram, Telegram), «Имя», «Телефон», «Что нужно», «Когда». Форма копируется вместе с таблицей. Названия вопросов можно на любом из 4 языков.
3. Аккаунт Cloudflare и `npm i -g wrangler`. Шаблон `worker/wrangler.toml`. Деплой на аккаунт клиента или на свой с отдельным Worker на клиента (тогда клиент должен знать и это записать в AVV).
4. Свой тестовый Gmail с правилом, свой Telegram-бот, тестовое приложение Meta с собственной страницей и Instagram: прогнать все каналы один раз.
5. Шпаргалка фильтров Gmail для типичных форм: WordPress (`wordpress@домен`), Wix (`no-reply@...wix...`), Jimdo, Google Forms.

## 4. Шаги на заказ (реальное время)

- trades, cleaning, office (почта + сайт): 1,5-2 часа.
  1. Видеозвонок, клиент сам входит в Google. Копия мастер-таблицы, `CONFIG_JSON`, `setupLeads()`, клиент жмёт «Разрешить». 20 мин.
  2. Смотрим 2-3 старые заявки в его почте, пишем `email.query` и `formSenders`. Проверка: Gmail-поиск с этим фильтром показывает только заявки. 20-30 мин.
  3. Развернуть Apps Script как веб-приложение (нужно для Worker и формы), URL в `wrangler.toml`. `LEADS_SECRET` из свойств скрипта в `wrangler secret put LEADS_SECRET`. 15 мин.
  4. Если можно править сайт: вставить форму из `site-form`, `ALLOWED_ORIGINS` и `THANKS_URL`. 20 мин.
  5. office и по желанию остальные: клиент создаёт бота у @BotFather, токен вставляет сам в `TG_BOT_TOKEN`, пишет боту /start, chat id в `notify.telegramChatIds`. 10 мин.
  6. Тестовая заявка с формы и с чужой почты, показать сортировку, галочку и этапы. Ярлык таблицы на рабочий стол телефона. 15 мин.
- clinic: 2-3 часа плюс бумажная часть: проверить, что у практики Google Workspace с принятым договором обработки данных, форма сайта без поля «жалобы», общий доступ к таблице только 2 людям. Facebook: отдельный этап (см. ниже).
- Instagram, Facebook (fitness, clinic по желанию): 1-2 часа настройки плюс App Review у Meta от нескольких дней, исход не гарантирован. Шаги: приложение Meta на аккаунте клиента, Business Verification, сценарий «Instagram API с входом через Instagram» или Messenger, вебхук `https://leads-<client>.workers.dev/meta`, `META_APP_SECRET` и `META_VERIFY_TOKEN` в секреты, подписка на `messages`, запрос Advanced Access на `instagram_business_manage_messages` (или `pages_messaging`) по пути «приложение для своего бизнеса».
- WhatsApp (fitness, other): 1-2 часа плюс подключение номера у партнёра (как в mail). Вебхук партнёра или Meta на `/meta`.
- Telegram Business (other): 20 мин. Бот клиента, `setWebhook` с `secret_token` = `TG_SECRET` на `/telegram`, в Telegram владельца: Настройки > Telegram для бизнеса > Чат-боты > выбрать бота, доступ «ко всем личным чатам, кроме контактов» или выбранным. `TG_OWNER_ID` = его id, чтобы его собственные ответы не становились заявками.

## 5. Что клиент должен дать (чек-лист)

- [ ] Google-аккаунт (Gmail), вход сам на звонке; клиника: Google Workspace
- [ ] Почта, куда приходят заявки, и 2-3 примера старых заявок
- [ ] Доступ к сайту или контакт того, кто его делал (для формы), или хотя бы адрес, с которого форма шлёт письма
- [ ] Для уведомлений: Telegram на телефоне (создаёт бота сам по подсказке) или согласие на письма-уведомления
- [ ] Instagram / Facebook: профессиональный аккаунт Instagram, связанный со страницей, права администратора, документы фирмы для Business Verification Meta
- [ ] WhatsApp: номер WhatsApp Business, карта для оплаты Meta и партнёра
- [ ] Telegram: аккаунт владельца, через который пишут клиенты
- [ ] Кто ещё должен видеть список (администратор): его Google-адрес

## 6. Ежемесячные расходы клиента (проверено 27.11.2026)

| Что | Цена | Источник |
|---|---|---|
| Google Таблица, Gmail, Apps Script | 0 € | [квоты Apps Script](https://developers.google.com/apps-script/guides/services/quotas) |
| Cloudflare Workers Free | 0 € | developers.cloudflare.com, не открывал сегодня |
| Telegram-бот | 0 € | [Bot API](https://core.telegram.org/bots/api) |
| Telegram Business, подключённый бот | по документации Telegram подключённые бизнес-боты доступны и без Premium ([core.telegram.org](https://core.telegram.org/api/bots/connected-business-bots)); остальные функции Business входят в Premium, около 4,99 $ в месяц по данным 2024 ([TechCrunch](https://techcrunch.com/2024/04/01/chat-app-telegram-challenges-meta-with-the-launch-of-new-business-features-and-revenue-sharing/)), цену в Германии проверить в приложении |
| Google Workspace (clinic обязательно) | 6,80 € пользователь/мес при оплате за год, 8,10 € помесячно | [workspace.google.com](https://workspace.google.com/intl/en_ie/pricing.html) |
| Instagram / Facebook API | 0 € | плата только временем на App Review |
| WhatsApp входящие от клиентов | бесплатно; ответы через приложение при coexistence бесплатно | [360dialog](https://docs.360dialog.com/docs/resources/phone-numbers/coexistence) |
| Партнёр WhatsApp | 360dialog 49 € в месяц за номер; Telnyx, Twilio без абонентской платы, около 0,004-0,005 $ за сообщение, входящие тоже считаются | [360dialog.com/pricing](https://360dialog.com/pricing), [telnyx](https://telnyx.com/resources/best-whatsapp-api-provider) |
| Альтернатива для Instagram без App Review: ManyChat + интеграция с Google Sheets | с 2.03.2026 новые тарифы, по данным третьих сторон Essential 17 $, Pro 39 $ в месяц, старый Pro 15 $; интеграция с Sheets на платном тарифе | [featurebase](https://www.featurebase.app/blog/manychat-pricing), [g2](https://www.g2.com/products/manychat/pricing); официальную страницу открыть не удалось |
| ИИ (по желанию) | доли цента на письмо с claude-haiku-5-5; при 300 письмах в месяц меньше 1 € | цену модели сверить на anthropic.com перед включением, не проверено |

## 7. Ограничения, право, правила платформ

- Что реально автоматизируется по каналам:
  - Почта: полностью. Только чтение и ярлык, ничего не удаляется и не перемещается. Пересылка из не-Gmail почты настраивается у почтового провайдера клиента.
  - Форма сайта: полностью (свой HTML на Worker или разбор писем формы).
  - Instagram Direct: технически да (вебхук `messages`), но в режиме Standard Access вебхуки приходят только от людей с ролью в приложении ([Meta Messenger webhooks](https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks), [App Review Instagram](https://developers.facebook.com/documentation/instagram-platform/app-review)). Для сообщений от всех людей нужен Advanced Access через App Review и Business Verification. На форуме Meta есть жалобы, что вебхуки Instagram приходят не всегда ([тред](https://developers.facebook.com/community/threads/2029428894384878/)). Поэтому в обещание за 29 € без расходов не входит.
  - Facebook Messenger: то же самое (App Review для `pages_messaging`). Если вебхук долго падает, Meta отписывает приложение, нужен контроль.
  - WhatsApp: личный номер или приложение WhatsApp Business без API читать автоматически нельзя. Только номер на Cloud API (с coexistence приложение продолжает работать). Неофициальные способы через веб-версию нарушают правила WhatsApp, номер блокируют.
  - Telegram: бот видит личные чаты владельца только через Telegram Business (подключённый бот). Сообщения в группах и каналах не берём.
- Meta WhatsApp: входящие от клиента открывают окно 24 часа; набор ничего клиентам не отправляет, только читает. Ответы владелец пишет сам в приложении.
- GDPR:
  - Заявки = персональные данные. Основание: подготовка договора (ст. 6(1)(b)). На форме галочка и ссылка на Datenschutzerklärung; в Datenschutzerklärung упомянуть Google, Cloudflare, Telegram, Meta.
  - Обработчики: Google (DPA только в Workspace), Cloudflare (DPA в аккаунте), Meta (условия обработки), Anthropic (если включён ИИ; DPA в коммерческих условиях, проверить при включении). Telegram не предлагает стандартного договора обработки данных: для строгих клиентов ставить `notify.detail: "minimal"` (в уведомлении нет имени и текста) или уведомления только письмом.
  - Михаил имеет доступ к данным при настройке: AVV с клиентом.
  - Срок хранения: закрытые строки удаляются через `retentionDays` (по умолчанию 365, клиника 90).
- Клиника: никаких данных о здоровье в лишних местах. Форма сайта: имя, телефон, удобное время, без поля «жалобы». Уведомление без содержания, ИИ выключен. Таблица только в Workspace практики. Если пациент сам пишет диагноз в письме, это остаётся в Gmail и таблице практики, не уходит в Telegram и ИИ. Согласовать с ответственным за защиту данных практики.
- Холодные письма (UWG § 7) набор не шлёт вообще.

## 8. Таблица выполнимости

| Пункт | Статус | Почему | Исправленное обещание (en / ru) |
|---|---|---|---|
| trades.leads | as-written | Gmail-фильтр + ярлык, форма через Worker, быстрая заявка из Google Формы, сортировка и напоминание перезвонить по смете. Бесплатно. | |
| cleaning.leads | as-written | То же, строка: имя, телефон, что нужно, какой день. | |
| office.leads | as-written | Почта раз в 5 минут, форма сразу, уведомление в Telegram. Telegram без DPA: при желании краткое уведомление. | |
| clinic.leads | needs-caveat | Сайт и почта работают. Facebook требует App Review и Business Verification у Meta, срок и исход не гарантированы. Данные о здоровье: Workspace с договором (это и есть fee), уведомление без текста. | en: Requests from new patients via your site and email in one list on your phone. Facebook joins once Meta approves it / ru: Запросы новых пациентов с сайта и почты в одной таблице в телефоне. Facebook добавим, когда Meta одобрит доступ |
| fitness.leads | needs-caveat | Почта бесплатно. Instagram автоматически только после App Review или через платный сервис, WhatsApp только с номером на Cloud API (платный партнёр). На карточке нет fee. | en: Requests from email and your site land in one list by themselves. Instagram and WhatsApp chats you add in 10 seconds / ru: Заявки с почты и сайта сами попадают в один список. Чаты из Instagram и WhatsApp добавляешь за 10 секунд |
| other.leads | needs-caveat | Telegram (Business-бот) и почта работают бесплатно. WhatsApp только через партнёра с coexistence: абонентка или плата за сообщения, доступность подключения проверять. | en: Customer messages from Telegram and email in one list. WhatsApp joins via a paid partner / ru: Сообщения клиентов из Telegram и почты в одном списке. WhatsApp подключается через платного партнёра |

Апгрейд за отдельные деньги (не на карточке): «Instagram автоматически» после App Review (+1 день работы, ожидание Meta) или через ManyChat (клиент платит ManyChat).

## Справка по конфигу и секретам

- `email.query` - строка поиска Gmail (без `-label:Leads`, это добавляется само); `formSenders` - адреса, с которых шлёт форма сайта; `label`.
- `notify.telegramChatIds`, `notify.email`, `notify.detail` = `full` | `minimal`.
- `followUpDays` - через сколько дней после «смета отправлена» строка поднимается наверх с «перезвонить».
- `health: true` - клиника: минимальные уведомления, ИИ запрещён.
- `llm.enabled`, `llm.provider`, `llm.model` - по умолчанию выключено.
- Script Properties: `CONFIG_JSON`, `LEADS_SECRET` (создаёт `setupLeads()`), `TG_BOT_TOKEN`, `LLM_API_KEY`, `SHEET_ID`.
- Worker secrets: `LEADS_SECRET`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `TG_SECRET`, `IG_TOKEN`, `LLM_API_KEY`. Vars в `wrangler.toml`.
- Apps Script веб-приложение отвечает на POST через редирект на googleusercontent.com; Worker идёт по редиректу (`redirect: "follow"`), запись в таблицу уже произошла до редиректа.
