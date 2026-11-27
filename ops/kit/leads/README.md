# leads: все заявки в одном списке на телефоне

Цена на сайте: €29 разово. У clinic и other отмечены сторонние расходы.
Всё проверено 27.11.2026. Что не удалось проверить первоисточником, помечено словом «не проверено».

Состав набора:

- `apps-script/` - Google Apps Script в таблице клиента: забирает заявки из почты, принимает заявки от Worker и формы сайта, сортирует список, шлёт уведомление в Telegram или на почту, утренняя сводка.
- `worker/` - Cloudflare Worker (один на клиента): форма сайта, вебхуки Meta (Instagram, Facebook, WhatsApp Cloud API), Telegram-бот для бизнес-чатов. Пересылает заявку строкой в таблицу.
- `site-form/form.html` - готовая форма для сайта клиента (с ловушкой для ботов и галочкой согласия).
- `config/*.example.json` - примеры для всех 6 ниш (вымышленные данные).
- `test/` - офлайн-тесты: `node --test ops/kit/leads/test/*.test.mjs` (20 тестов, все проходят, сеть замокана).

Проверка скептиком 27.11.2026, исправлено:
- Worker раньше считал заявку сохранённой при любом HTTP 200, а Apps Script отвечает 200 даже на «неверный секрет». Теперь Worker ждёт `{ok:true}`, повторяет до 3 раз, форма сайта при сбое показывает посетителю «не отправилось, позвоните» вместо ложного «спасибо», Telegram получает 500 и пришлёт сообщение ещё раз, по Meta уходит тревога владельцу (`ALERT_BOT_TOKEN`, `ALERT_CHAT_ID`).
- Сбой уведомления (Telegram недоступен, лимит почты) больше не роняет запись заявки; занятая блокировка отвечает `busy`, Worker повторяет.
- В бизнес-чатах Telegram ответы владельца и сотрудников отсекаются по `chat.id`, даже если `TG_OWNER_ID` не заполнен.
- Instagram API с входом через Instagram подписывает вебхуки секретом Instagram-приложения: добавлен `IG_APP_SECRET`.
- Вызов claude-haiku-5-5 с `thinking: {type: "disabled"}`: у Haiku 5.5 мышление включено по умолчанию и съело бы весь лимит токенов на короткую сводку.

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
| Telegram Business, подключённый бот | источники расходятся: по [SendPulse](https://sendpulse.com/en/knowledge-base/chatbot/telegram/telegram-business) с 8.05.2026 Premium для подключения бота не нужен, по changelog [chat-data](https://www.chat-data.com/changelog/telegram-business-support) от 12.05.2026 нужен. Не проверено. Если нужен Premium, это около 4,99 $ в месяц по данным 2024 ([TechCrunch](https://techcrunch.com/2024/04/01/chat-app-telegram-challenges-meta-with-the-launch-of-new-business-features-and-revenue-sharing/)). Проверить в приложении клиента на звонке до оплаты |
| Google Workspace (clinic обязательно) | 6,80 € пользователь/мес при оплате за год, 8,10 € помесячно | [workspace.google.com](https://workspace.google.com/intl/en_ie/pricing.html) |
| Instagram / Facebook API | 0 € | плата только временем на App Review |
| WhatsApp входящие от клиентов | бесплатно; ответы через приложение при coexistence бесплатно | [360dialog](https://docs.360dialog.com/docs/resources/phone-numbers/coexistence) |
| Партнёр WhatsApp | 360dialog 49 € в месяц за номер; Telnyx, Twilio без абонентской платы, около 0,004-0,005 $ за сообщение, входящие тоже считаются | [360dialog.com/pricing](https://360dialog.com/pricing), [telnyx](https://telnyx.com/resources/best-whatsapp-api-provider) |
| Альтернатива для Instagram без App Review: ManyChat + интеграция с Google Sheets | с 2.03.2026 новые тарифы, по данным третьих сторон Essential 17 $, Pro 39 $ в месяц, старый Pro 15 $; интеграция с Sheets на платном тарифе | [featurebase](https://www.featurebase.app/blog/manychat-pricing), [g2](https://www.g2.com/products/manychat/pricing); официальную страницу открыть не удалось |
| ИИ (по желанию) | claude-haiku-5-5: 0,10 $ за 1 млн входных токенов, 0,50 $ за 1 млн выходных (справочник Anthropic, данные на 3.11.2026). 300 писем по 1000 токенов в месяц = около 0,03 $ | [anthropic.com/pricing](https://www.anthropic.com/pricing); ключ API на аккаунте клиента, нужен минимальный платёж Anthropic, сумму проверить при включении |

## 7. Ограничения, право, правила платформ

- Что реально автоматизируется по каналам:
  - Почта: полностью. Только чтение и ярлык, ничего не удаляется и не перемещается. Пересылка из не-Gmail почты настраивается у почтового провайдера клиента.
  - Форма сайта: полностью (свой HTML на Worker или разбор писем формы).
  - Instagram Direct: технически да (вебхук `messages`), но в режиме Standard Access вебхуки приходят только от людей с ролью в приложении ([Meta Messenger webhooks](https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks), [App Review Instagram](https://developers.facebook.com/documentation/instagram-platform/app-review)). Для сообщений от всех людей нужен Advanced Access через App Review и Business Verification. На форуме Meta есть жалобы, что вебхуки Instagram приходят не всегда ([тред](https://developers.facebook.com/community/threads/2029428894384878/)). Поэтому в обещание за 29 € без расходов не входит.
  - Facebook Messenger: то же самое (App Review для `pages_messaging`). Если вебхук долго падает, Meta отписывает приложение, нужен контроль.
  - WhatsApp: личный номер или приложение WhatsApp Business без API читать автоматически нельзя. Только номер на Cloud API (с coexistence приложение продолжает работать). Неофициальные способы через веб-версию нарушают правила WhatsApp, номер блокируют.
  - Telegram: бот видит личные чаты владельца только через Telegram Business (подключённый бот). Сообщения в группах и каналах не берём. Нужен ли для этого Premium в 2026 году, источники расходятся (см. раздел 6).
- Facebook-страница и Instagram сами шлют администратору письма о новых сообщениях (если это включено в настройках уведомлений). Такое письмо Gmail-фильтр может забрать как заявку, без App Review. Текст и формат этих писем не проверены: проверить на первом заказе, обещанием это не считать.
- Telegram не подписывает договор обработки данных. Для налоговых консультантов, бухгалтеров и врачей (§ 203 StGB) имя и текст заявки в Telegram не отправлять: `notify.detail: "minimal"` или уведомление письмом (пуш Gmail на телефоне).
- Meta WhatsApp: входящие от клиента открывают окно 24 часа; набор ничего клиентам не отправляет, только читает. Ответы владелец пишет сам в приложении.
- GDPR:
  - Заявки = персональные данные. Основание: подготовка договора (ст. 6(1)(b)). На форме галочка и ссылка на Datenschutzerklärung; в Datenschutzerklärung упомянуть Google, Cloudflare, Telegram, Meta.
  - Обработчики: Google (DPA только в Workspace), Cloudflare (DPA в аккаунте), Meta (условия обработки), Anthropic (если включён ИИ; DPA в коммерческих условиях, проверить при включении). Telegram не предлагает стандартного договора обработки данных: для строгих клиентов ставить `notify.detail: "minimal"` (в уведомлении нет имени и текста) или уведомления только письмом.
  - Михаил имеет доступ к данным при настройке: AVV с клиентом.
  - Срок хранения: закрытые строки удаляются через `retentionDays` (по умолчанию 365, клиника 90).
- Клиника: никаких данных о здоровье в лишних местах. Форма сайта: имя, телефон, удобное время, без поля «жалобы». Уведомление без содержания, ИИ выключен. Таблица только в Workspace практики. Если пациент сам пишет диагноз в письме, это остаётся в Gmail и таблице практики, не уходит в Telegram и ИИ. Согласовать с ответственным за защиту данных практики.
- Холодные письма (UWG § 7) набор не шлёт вообще.

## 8. Таблица выполнимости

Пересмотрено скептиком 27.11.2026. Цена 29 € разово.

| Пункт | Статус | Почему | Исправленное обещание (en / ru) |
|---|---|---|---|
| trades.leads | as-written | Gmail-фильтр + ярлык, письма не двигаются; форма через Worker; звонки и WhatsApp мастер вносит через быструю Google Форму. Сортировка и «перезвонить по смете» работают. Бесплатно. Если почта не Gmail (GMX, web.de, T-Online), нужна пересылка в Gmail клиента, проверить на звонке. | |
| cleaning.leads | as-written | То же. Имя, телефон и день разложены по колонкам, если их спрашивает форма сайта; из свободного письма день и телефон видны в тексте «что нужно». | |
| office.leads | needs-caveat | Технически работает: форма за секунды, почта раз в 5 минут, не «сразу». Но офис = чаще всего налоговый консультант или бухгалтер (§ 203 StGB), а Telegram не даёт договора обработки данных: имя и текст заявки туда отправлять нельзя. Полное уведомление делаем пушем Gmail на телефон (Google с договором в Workspace), в Telegram только «новая заявка, открыть список». | en: Anyone who writes via your website or email shows up on your phone within 5 minutes / ru: Кто написал тебе с сайта или на почту, через 5 минут виден в твоём телефоне |
| clinic.leads | needs-caveat | Сайт и почта работают. Facebook автоматически только после App Review и Business Verification у Meta: часы работы, исход не гарантирован, за 29 € не обещать. Данные о здоровье: Workspace с договором (это и есть fee), уведомление без текста, ИИ выключен. | en: Requests from new patients via your site and email in one list on your phone. Facebook messages you add in seconds / ru: Запросы новых пациентов с сайта и почты в одной таблице в телефоне. Сообщения из Facebook добавляешь за секунды |
| fitness.leads | needs-caveat | Почта бесплатно. Instagram Direct автоматически только с Advanced Access (App Review и Business Verification); в Standard Access вебхуки приходят только от людей с ролью в приложении. WhatsApp только с номером на Cloud API (платный партнёр). На карточке нет fee. | en: Requests from email and your site land in one list by themselves. Instagram and WhatsApp chats you add in 10 seconds / ru: Заявки с почты и сайта сами попадают в один список. Чаты из Instagram и WhatsApp добавляешь за 10 секунд |
| other.leads | needs-caveat | Telegram (бот в Telegram Business) и почта работают; нужен ли Premium, не проверено. WhatsApp только через партнёра с coexistence (360dialog 49 € в месяц или поштучно), это больше цены услуги за 2 месяца. | en: Customer messages from Telegram and email in one list. WhatsApp joins via a paid partner / ru: Сообщения клиентов из Telegram и почты в одном списке. WhatsApp подключается через платного партнёра |

Апгрейд за отдельные деньги (не на карточке): «Instagram автоматически» после App Review (+1 день работы, ожидание Meta) или через ManyChat (клиент платит ManyChat).

## Справка по конфигу и секретам

- `email.query` - строка поиска Gmail (без `-label:Leads`, это добавляется само); `formSenders` - адреса, с которых шлёт форма сайта; `label`.
- `notify.telegramChatIds`, `notify.email`, `notify.detail` = `full` | `minimal`.
- `followUpDays` - через сколько дней после «смета отправлена» строка поднимается наверх с «перезвонить».
- `health: true` - клиника: минимальные уведомления, ИИ запрещён.
- `llm.enabled`, `llm.provider`, `llm.model` - по умолчанию выключено.
- Script Properties: `CONFIG_JSON`, `LEADS_SECRET` (создаёт `setupLeads()`), `TG_BOT_TOKEN`, `LLM_API_KEY`, `SHEET_ID`.
- Worker secrets: `LEADS_SECRET`, `META_APP_SECRET`, `IG_APP_SECRET`, `META_VERIFY_TOKEN`, `TG_SECRET`, `IG_TOKEN`, `LLM_API_KEY`, `ALERT_BOT_TOKEN`. Vars в `wrangler.toml` (в том числе `ALERT_CHAT_ID`).
- Apps Script веб-приложение отвечает на POST через редирект на googleusercontent.com; Worker идёт по редиректу (`redirect: "follow"`), запись в таблицу уже произошла до редиректа.
