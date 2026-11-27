# bot: ответы и запись (79 € разово)

Набор, чтобы закрыть карточку `bot` во всех нишах. Всё проверено тестами без сети (см. «Тесты» внизу).
Факты о ценах и правилах проверены поиском 27.11.2026. Сайт developers.facebook.com из моей среды не открывался,
поэтому цифры Meta взяты из результатов поиска и сторонних обзоров: перед первым заказом сверь их по ссылкам ниже.

## Коротко: три уровня

| Уровень | Что это | Цена для клиента в месяц | Время на заказ |
|---|---|---|---|
| A. Автоответ | Бесплатное приложение WhatsApp Business: приветствие для новых, автоответ вне часов, быстрые ответы, каталог. Для Instagram: автоматизации в Meta Business Suite. Тексты генерирует `autoreply/build.mjs`. | 0 € | 30-45 мин на звонке |
| B. Ссылка на запись | Страница записи (Google Календарь или Cal.com) плюс ссылка в автоответе. Записи сами встают в календарь. | 0 € | 1-1,5 ч |
| C. Движок | Наш Worker (`engine/`): WhatsApp Cloud API или чат на сайте, модель Claude Haiku отвечает только из `business.json`, свободное время берёт из Google Календаря клиента, записывает, зовёт владельца, если не знает. | 0-55 € (см. раздел 6) | 3-4 ч, первый раз 1 день |

Главное правило выбора: если карточка обещает только «ответ сразу», хватает уровня A. Если обещает
«видит календарь и записывает» или «отвечает на вопросы своими словами», нужен уровень C.

## 1. Что именно получает клиент (по нишам)

| Ниша | Обещание на сайте | Что ставим |
|---|---|---|
| salon | «Clients who write to your WhatsApp at night get a free time for nails, hair or massage» / «Клиентка пишет ночью в WhatsApp и сразу узнаёт, когда можно прийти на маникюр или массаж» | За 79 €: A+B (автоответ со ссылкой на страницу записи Google Календаря, запись встаёт в календарь сама). Отдельным заказом: C, движок, `booking.mode = calendar`, календарь через Apps Script (Google Календарь на телефоне). Клиентка пишет, получает 3 свободных времени, отвечает цифрой, событие встаёт в календарь. Пример: `engine/businesses/salon-lila.json`. |
| cafe | «Guests book a table in WhatsApp or Instagram at night and get an answer at once» / «Гости бронируют столик в WhatsApp или Instagram даже ночью, ответ приходит сразу» | По карточке: 20 минут по видео, значит A: автоответ в WhatsApp Business и в Meta Business Suite для Instagram, гость пишет день, время, людей, имя; заявка уже лежит в WhatsApp кафе, утром подтверждают. Полная бронь с подсчётом столов: C, `booking.mode = tables` (только WhatsApp, Instagram через API требует проверки приложения Meta, см. раздел 7). Пример: `engine/businesses/cafe-olive.json`. |
| shop | «Your WhatsApp answers shoppers on stock, prices, hours. Family chats as usual» / «WhatsApp сам отвечает покупателям про цены и часы. Родным пишешь как раньше» | A: приветствие только для «не из контактов» (родные не получают), часы, каталог WhatsApp с ценами. Ответ про конкретный товар («есть батарейки АА?»): только C, `booking.mode = none`, номера родных в секрете `IGNORE_NUMBERS`. Пример: `engine/businesses/shop-eck.json`. |
| trades | «Your WhatsApp answers new clients in seconds, even while you're under a sink» / «Новый клиент сразу получает ответ в WhatsApp, пока ты на объекте» | A: приветственное сообщение (уходит новому контакту или после 14 дней тишины), фильтр «не из контактов», просьба прислать адрес и фото. Текст: `autoreply/examples/trades-example.json`. |
| fitness | «A helper on your WhatsApp answers questions on prices and trials, even at night» / «Помощник в твоём WhatsApp сразу отвечает про цены и пробное, даже ночью» | За 79 €: A+B (автоответ с ценами, пробным и ссылкой на запись). Отдельным заказом: C, `booking.mode = classes`, расписание групп в `business.json`, запись на пробное, владелец утром получает «new booking: Anna, ...» в свой WhatsApp. Если не знает: «Я уточню» и сообщение владельцу. Пример: `engine/businesses/fitness-move.json`. |
| clinic | «Patients writing at night get an answer on WhatsApp, you confirm in the morning» / «Пациент пишет ночью в WhatsApp, сразу получает ответ и просит время приёма» | A: автоответ вне часов с прайсом для самоплательщиков, просьбой написать день и время и запретом присылать данные о здоровье. Без модели. Движок C возможен (`booking.mode = request`, `health_guard`), но не советую, см. раздел 7. |
| cleaning | «Clients get your price on WhatsApp in a minute, even while you sleep» / «Клиент получает цену в WhatsApp за минуту, даже ночью, пока ты спишь» | A: автоответ вне часов с прайсом и районами, просьба прислать адрес и день. Текст: `autoreply/examples/cleaning-example.json`. |
| office | «A chat on your website answers clients day and night and books them a call with you» / «Чат на твоём сайте отвечает клиентам днём и ночью и записывает их на звонок с тобой» | C без Meta: виджет `engine/widget/widget.js` на сайте клиента, отвечает только по прайсу, показывает 3 времени, клиент жмёт время, вводит имя и телефон, событие с напоминанием на телефоне встаёт в Google Календарь. Пример: `engine/businesses/office-steuer.json`. |
| other | «Customers get a reply in WhatsApp in a minute, even at 11 pm» / «Клиент в WhatsApp получает ответ за минуту, даже в 11 вечера» | A+B: автоответ с ценами и ссылкой на страницу записи, записи в календаре, остальные вопросы в WhatsApp. Отдельным заказом C как у салона. |

## 2. Стек

- **WhatsApp Business app** (бесплатно, у клиента на телефоне): приветствие, автоответ, быстрые ответы, каталог. Автоответы шлёт сам телефон, ему нужен интернет.
- **Meta Business Suite** (бесплатно): автоответ, сообщение «нет на месте» и частые вопросы для Instagram Direct.
- **Страница записи**: Google Calendar appointment schedule (в бесплатном аккаунте одна страница, без писем-напоминаний клиенту) или Cal.com Free (один человек, без ограничения записей).
- **WhatsApp Cloud API** (уровень C). Номер клиента остаётся в приложении на телефоне благодаря режиму coexistence: владелец видит все чаты и может ответить сам. Когда владелец пишет в чат из приложения, движок молчит в этом чате 12 часов (`human_pause_hours`).
- **Cloudflare Worker** `engine/` (бесплатный тариф, аккаунт клиента). Хранит только историю чата за сутки в KV.
- **Модель**: Anthropic Messages API, `claude-haiku-5-5` (дёшево и быстро). Замена в одну строку: `LLM_MODEL = "claude-sonnet-5-5"` или `LLM_PROVIDER = "workers-ai"` (Workers AI, бесплатный лимит).
- **Календарь**: `engine/apps-script/Calendar.gs` в Google-аккаунте клиента. Работает от имени клиента, читает занятость и создаёт события, защищён токеном.
- **Оповещение владельца**: его WhatsApp (`notify: "whatsapp"`), Telegram (`notify: "telegram"`) или ничего, если всё видно в приложении (`notify: "none"`).

Как устроен движок: модель только понимает, чего хочет человек, и пишет короткий ответ из фактов `business.json`.
Время, запись, подсчёт столов, передачу владельцу делает код. Проверки после модели: каждая сумма в ответе должна быть
в прайсе, каждое время должно быть в часах работы или фактах, иначе ответ не уходит, а владелец получает вопрос.
Первое сообщение каждому собеседнику помечено «автоматический помощник» (AI Act, ст. 50).

## 3. Подготовка один раз (Михаил)

1. Прогнать тесты (раздел «Тесты»), прочитать `engine/businesses/*.json`: это шаблоны для новых клиентов. 30 мин.
2. Завести свой аккаунт Anthropic только для тестов. Для клиентов ключ лучше на аккаунте клиента.
3. Решить путь к WhatsApp Cloud API для номеров клиентов (один раз, это главный риск):
   - **Путь 1. Стать Tech Provider в Meta.** Подтвердить свой бизнес в Meta (Business Verification), создать приложение, пройти шаги «Get started for Tech Providers», включить Embedded Signup с coexistence. После этого клиент сам подключает свой номер за 10 минут, платит Meta своей картой, посредника нет. Срок: от нескольких дней до недель ожидания проверки. Не проверено, хватит ли статуса Einzelunternehmer без сайта компании: проверить на первом шаге.
   - **Путь 2. Посредник (BSP) с coexistence**, например 360dialog: около 49 € в месяц за номер (Regular). Быстро, но клиент платит каждый месяц.
   - **Путь 3. Отдельный новый номер** прямо в Cloud API, приложение Meta на аккаунте клиента. Посредник не нужен, старый номер не трогаем. Минус: клиенты пишут на новый номер, обещание «в твоём WhatsApp» не выполняется буквально.
   Пока путь 1 не готов, продавать уровень C только сайтовым чатом (office) или через путь 2.
4. В тестовом аккаунте Meta (там есть бесплатный тестовый номер) провести один разговор через `wrangler dev` и туннель. 2-3 ч.
5. Подготовить на немецком: договор обработки данных (AVV) между клиентом и тобой, абзац для Datenschutzerklärung клиента («WhatsApp, автоматический помощник, Anthropic, Cloudflare, Google»). Взять у юриста или из генератора, один раз.
6. Шаблон WhatsApp для владельца `owner_alert` (категория Utility, один параметр {{1}}): текст вида «Neue Nachricht vom Chat-Assistenten: {{1}}». Подаётся в каждом аккаунте клиента, проверка Meta обычно быстрая, срок не гарантирован.

## 4. Шаги на заказ

### Уровень A (trades, cleaning, clinic, cafe, shop): 30-45 мин
1. Клиент присылает цены, часы, районы (5 мин чтения).
2. Заполнить копию примера `autoreply/examples/*.json`, запустить `node autoreply/build.mjs файл.json > лист.txt`. 10 мин.
3. Видеозвонок: клиент ставит WhatsApp Business (если ещё нет, чаты переносятся при переходе с обычного WhatsApp на том же телефоне), вставляем приветствие, автоответ по расписанию «вне часов работы», 2-3 быстрых ответа, фильтр получателей «не из контактов». Для кафе ещё Meta Business Suite: Inbox, Automations, instant reply и away message для Instagram. 20-30 мин.
4. Тест: пишем с твоего номера, проверяем, что пришло. 5 мин.

### Уровень B (по карточке за 79 €: salon, other, fitness): 1-1,5 ч
1. В аккаунте клиента: Google Календарь, Appointment schedule (только с компьютера) или Cal.com. Услуги, длительность, перерывы. 30-40 мин.
2. Ссылку в автоответ, статус WhatsApp, профиль Instagram, Google Maps. 15 мин.
3. Тестовая запись вместе с клиентом. 10 мин.

### Уровень C, WhatsApp (только как отдельный, более дорогой заказ): 3-4 ч
1. Скопировать пример из `engine/businesses/`, заполнить услуги, цены, длительность, часы, исключения, FAQ, тексты владельца. 45 мин.
2. Подключить номер (путь из раздела 3). Путь 1: клиент проходит Embedded Signup по ссылке, 15 мин. Путь 2: через кабинет посредника, 30 мин.
3. В Google-аккаунте клиента: script.google.com, новый проект, вставить `apps-script/Calendar.gs` и `appsscript.json`, Script properties: `TOKEN`. Deploy, Web app, «Execute as me», «Anyone». 15 мин.
4. В Cloudflare клиента: `wrangler kv namespace create CHATS`, id в `wrangler.toml`, секреты (`ANTHROPIC_API_KEY`, `WA_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `GAS_URL`, `GAS_TOKEN`, при надобности `OWNER_WA`, `IGNORE_NUMBERS`), `wrangler deploy`. 20 мин.
5. В приложении Meta: Webhook URL `https://<worker>/wa`, verify token, подписка на поля `messages` и `smb_message_echoes`. 15 мин.
6. Тест 10 сообщений на 2 языках вместе с владельцем: цена, свободное время, запись, вопрос «не из прайса», голосовое. 30 мин.
7. Передача: показать, как поставить паузу (просто ответить в чате самому), где менять цены (присылает тебе, ты меняешь json и делаешь `wrangler deploy`, 5 мин).

### Уровень C, сайт (office): 2-2,5 ч
Шаги 1, 3, 4 как выше (без WhatsApp-секретов), `site_origins` = адрес сайта клиента. Вставить одну строку
`<script src=".../widget.js" data-endpoint="https://<worker>/chat" data-biz="<id>" data-lang="de" data-privacy="/datenschutz" defer></script>`.
Тест записи, проверка напоминания на телефоне (событие создаётся с напоминанием за `owner_reminder_min` минут).

## 5. Что прислать клиенту (чек-лист)

- [ ] Цены и услуги (фото прайса подойдёт), длительность каждой услуги для записи
- [ ] Часы работы и выходные, праздники
- [ ] 5-10 частых вопросов с ответами (парковка, оплата, отмена)
- [ ] Языки клиентов (de, ru, uk, en)
- [ ] Для A: телефон с WhatsApp Business под рукой на звонке
- [ ] Для C: доступ к Google-аккаунту с календарём (на звонке), Meta Business аккаунт или готовность его создать, карта для оплаты Meta и Anthropic (на имя клиента), аккаунт Cloudflare (бесплатный)
- [ ] Для кафе: сколько столов можно отдавать под бронь, на сколько часов, максимальная компания
- [ ] Для магазина: номера родных, которым бот не отвечает
- [ ] Для фитнеса: расписание групп и какие подходят для пробного
- [ ] Для офиса: адрес сайта и кто его правит
- [ ] Подписанный AVV и обновлённая Datenschutzerklärung

## 6. Ежемесячные расходы клиента (проверено 27.11.2026)

| Что | Сколько | Источник |
|---|---|---|
| WhatsApp Business app, автоответы | 0 € | приложение бесплатное, автоответы не тарифицируются |
| Meta Business Suite для Instagram | 0 € | |
| Google appointment schedule (1 страница) | 0 € (напоминания клиенту по почте только в платных тарифах) | [Google help](https://support.google.com/calendar/answer/16287038) |
| Cal.com Free | 0 € | [cal.com/pricing](https://cal.com/pricing) |
| WhatsApp Cloud API: ответы в окне 24 ч | с 01.10.2026 Meta берёт плату за каждый ответ через API (раньше ответы в окне 24 ч были бесплатны), ставка как utility страны получателя: Германия 0,0456 € (несколько посредников, официальный rate card не открылся). Посредники (Sinch, SendPulse, Chatarmin) пишут о 1000 бесплатных сообщений на номер в месяц, на странице Meta в выдаче этого не видно: считать, что их может не быть. 300 ответов в месяц: до 14 € | [Twilio о смене тарифов](https://help.twilio.com/articles/53100480177819), [страница Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| Шаблон владельцу вне окна 24 ч | около 0,046 € за штуку (Германия, utility) | там же |
| Посредник 360dialog (только путь 2) | 49 € за номер | [360dialog pricing](https://360dialog.com/pricing) |
| Claude Haiku 5.5 | 0,10 $ / 0,50 $ за 1 млн токенов. Один ответ примерно 3000 токенов на входе: около 0,0005 $. 1000 ответов: около 0,5 $ | [цены Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) |
| Cloudflare Workers Free | 0 €: 100 000 запросов в день, KV 1000 записей в день (это около 200 сообщений в день, дальше тариф Workers Paid 5 $) | [Workers limits](https://developers.cloudflare.com/workers/platform/limits), [KV limits](https://developers.cloudflare.com/kv/platform/limits) |
| Apps Script, Google Календарь | 0 € | лимиты личного аккаунта для одной точки не проверял, для салона хватает с запасом |
| Telegram для оповещений | 0 € | |

Итого для клиента: A и B 0 €; C через путь 1 или 3 от 1 до 15 € в месяц (зависит от того, есть ли 1000 бесплатных); C через посредника около 50-65 €.
Не проверено напрямую у Meta: точные ставки 2026 для Германии и детали бесплатных 1000 сообщений. Перед продажей открыть официальный rate card.

## 7. Ограничения, право, правила площадок

- **GDPR.** Клиент отвечает за данные (Verantwortlicher). Ты обработчик, пока у тебя есть доступ: нужен AVV по ст. 28. Обработчики клиента: Meta (условия обработки данных WhatsApp Business принимаются при создании аккаунта), Anthropic (DPA входит в Commercial Terms, данные API хранятся до 30 дней по умолчанию), Cloudflare (DPA в условиях), Google. В бесплатном Google-аккаунте нет AVV: имена и телефоны в календаре строго по GDPR лучше держать в Google Workspace (платно). Скажи клиенту честно. В Datenschutzerklärung клиента добавить WhatsApp, автоматического помощника и обработчиков.
- **AI Act, ст. 50** действует с 02.08.2026: человек должен знать, что говорит с машиной. Движок пишет это в первом сообщении, виджет показывает постоянно. Не выключать (`ai_disclosure`).
- **WhatsApp.** Пишет всегда клиент первым, бот отвечает в окне 24 ч. После 24 ч только одобренные шаблоны, они платные. Рекламу без явного согласия не слать. Нужен понятный путь к человеку: движок передаёт владельцу всё, чего нет в фактах, и замолкает, когда владелец пишет сам. Боты общего назначения (как ChatGPT) в Business API запрещены с 15.01.2026, бот одного бизнеса по его прайсу разрешён. В ЕС Meta временно (на 12 месяцев с марта 2026) допускает и общие боты из-за проверки Еврокомиссии: нас это не касается.
- **Автоответы приложения** уходят только если телефон в сети. Одно приветствие и один автоответ на всё, язык один на сообщение (ставим 2 языка подряд).
- **Meta Business Agent** (встроенный ИИ Meta в WhatsApp Business) с июня 2026 выкатывается по миру, но доступ по странам и аккаунтам, цена через подписку. Проверить в приложении клиента: «Инструменты». Если есть, для shop и fitness это может быть проще движка. Не проверено для Германии. Если его включить, автоматизации Business Suite встают на паузу.
- **Instagram.** Автоответы Business Suite бесплатны и безопасны. Свой бот в Instagram Direct через API: для чужих аккаунтов нужен Advanced Access с проверкой приложения и Business Verification, отвечать можно в окне 24 ч (Human Agent до 7 дней). Поэтому в Instagram только уровень A.
- **Клиника.** Сообщения со словами о здоровье не уходят в модель (`health_guard`), бот отвечает «на вопросы о здоровье здесь не отвечаем» и даёт 116117 и 112. Но сам WhatsApp для переписки с пациентами в Германии спорен (данные ст. 9 GDPR у Meta). Рекомендую уровень A: статичный автоответ без модели, просьба не присылать данные о здоровье. Владельцу в Telegram не пересылать текст пациента (Telegram без AVV), движок шлёт только «новое сообщение, прочитай в WhatsApp».
- **Без холодных сообщений (UWG §7).** Движок только отвечает тем, кто написал. Никаких рассылок по номерам из базы.
- **Магазин.** Наличие в `business.json` правит владелец (или ты по его сообщению). Если товара нет в списке, бот не угадывает, а передаёт владельцу.
- **Надёжность движка.** Если календарь, KV или модель падают, клиент всё равно получает «извините, скоро ответит человек», а владелец сигнал. Если Graph API не принял ответ (истёк токен), владелец получает «ответь сам». Поэтому для C лучше `notify: "telegram"` (кроме клиник): оповещение через WhatsApp при сломанном токене тоже не дойдёт.
- **Цена 79 € за уровень C** почти не окупает 3-4 часа. Либо поднимать цену для C, либо продавать A+B по 79 €, а C как отдельный вариант.

## 8. Таблица выполнимости

Проверка скептиком 27.11.2026. Главная поправка: уровень C в WhatsApp держится на трёх непроверенных вещах
(coexistence для номеров в Германии, статус Tech Provider для одиночки, Business Verification), и с 01.10.2026
каждый ответ бота через API платный (около 0,046 € в Германии, бесплатные 1000 в месяц только по данным посредников).
За 79 € разово честно обещать можно только то, что делают уровни A и B. Уровень C продавать отдельно и дороже,
когда путь 1 или 2 из раздела 3 проверен на первом клиенте.

| Задача | Статус | Почему | Исправленное обещание (en / ru) |
|---|---|---|---|
| salon.bot | needs-caveat | «Программа читает календарь и предлагает время в чате» это уровень C: Cloud API через coexistence (доступность в Германии не подтверждена официально), Tech Provider или посредник 49 €/мес, ключи Anthropic и Cloudflare, 3-4 ч плюс день подготовки. За 79 € надёжно: автоответ со ссылкой на страницу записи Google Календаря (уровень B), запись встаёт в календарь сама. iPhone-календарь (iCloud) не подходит, нужен Google Календарь | en: «Night messages on WhatsApp get your booking link. Clients pick a free time, it lands in your Google Calendar» / ru: «Ночью в WhatsApp клиентка сразу получает ссылку на запись, выбирает свободное время, и запись встаёт в твой Google Календарь» |
| cafe.bot | needs-caveat | За 20 минут ставится только автоответ (A). Он не знает, есть ли столик: гость оставляет заявку, кафе подтверждает утром. Заявки из Instagram остаются во входящих Instagram, а не в WhatsApp. Подсчёт столов (C) только в WhatsApp и только через Cloud API. Строки short и get тоже поправить | en: «Guests who write in WhatsApp or Instagram at night get an answer at once and leave a table request» (short: «Guests ask for a table, even at night»; get: «Requests wait in your WhatsApp and Instagram inbox») / ru: «Гости пишут ночью в WhatsApp или Instagram, сразу получают ответ и оставляют заявку на столик» (short: «Гости просят столик даже ночью»; get: «Заявки ждут тебя в WhatsApp и в Instagram») |
| shop.bot | needs-caveat | Бесплатно (A): приветствие и автоответ только для «не из контактов», часы, каталог с ценами. Ответ про конкретный товар и наличие, как в истории «after», только через C и список, который владелец обновляет | en: «New shoppers on WhatsApp get your hours and price list at once. Family chats as usual» / ru: «Новые покупатели в WhatsApp сразу получают часы работы и прайс. Родным пишешь как раньше» |
| trades.bot | as-written | Приветствие WhatsApp Business для новых контактов (и после 14 дней тишины), фильтр «не из контактов», просьба прислать адрес и фото. Бесплатно, 30 минут. Телефону нужен интернет | |
| fitness.bot | needs-caveat | Строка get («помощник пишет "уточню" и сообщает тебе») и запись на пробное в чате требуют уровня C с теми же рисками, что у салона. Движок записывает на пробное без проверки мест в группе (календарь `none`), владелец только получает сообщение. За 79 € надёжно: автоответ с ценами, условиями пробного и ссылкой на запись | en: «Night messages on WhatsApp get your prices, the free trial and a link to book it» / ru: «Ночью в WhatsApp человек сразу получает цены, условия пробного и ссылку на запись» |
| clinic.bot | needs-caveat | Ответ сразу даёт статичный автоответ вне часов: цены для самоплательщиков, часы, просьба написать день и время и не писать о здоровье. Без модели. Само обещание выполнимо, оговорка правовая: переписка с пациентами в WhatsApp остаётся решением практики (ст. 9 GDPR), бот с моделью не советую | en: «Patients writing at night get your prices and hours on WhatsApp at once, you set the time in the morning» / ru: «Пациент пишет ночью в WhatsApp, сразу получает цены и часы приёма, время ты назначаешь утром» |
| cleaning.bot | as-written | Автоответ вне часов с прайсом и районами, просьба прислать адрес и день. Бесплатно. Клиент видит прайс «от», а не расчёт под свою квартиру, как и в истории «after» | |
| office.bot | as-written | Виджет на сайте плюс движок плюс Apps Script: ответ только по прайсу, 3 времени, запись в Google Календарь с напоминанием. Без Meta. Нужны доступ к сайту, аккаунт Cloudflare и ключ Anthropic на клиента. Для Steuerberater и других Berufsgeheimnisträger: в чат не вводить данные мандантов (виджет так и пишет), с Anthropic нужна оговорка о § 203 StGB в договоре | |
| other.bot | as-written | Через уровни A+B: автоответ за минуту с ценами и ссылкой на страницу записи, записи сами встают в календарь, остальные вопросы остаются в WhatsApp. Конкретные часы прямо в чате, как в истории «after», только через C | |

## Тесты

```
cd ops/kit/bot/engine && node --test test/*.test.mjs
```
27 тестов, сеть не нужна, платные API не вызываются (Anthropic, Graph API, Cal.com и Apps Script подменены).
Проверяют: время и часовые пояса, свободные окна и вместимость, запись салона цифрой, защиту от двойной записи,
проверку сумм и времени, ответ магазина, бронь и отказ кафе, запись на пробное с шаблоном при закрытом окне 24 ч,
защиту клиники, подпись вебхука, игнор номеров родных, повтор вебхука Meta, паузу при ответе владельца,
голосовые, мост Apps Script (токен, конфликт, вместимость), сайтовый чат с записью в календарь, Cal.com, листы автоответов.
После проверки скептиком добавлено: календарь упал, значит клиент всё равно получает вежливый ответ, владелец получает сигнал;
сбой оповещения владельца не отменяет подтверждение записи; Graph API не принял ответ, значит владелец получает «ответь сам».
Сборка Worker проверена через `wrangler deploy --dry-run`.

## Файлы

- `engine/src/` движок: `core.js` логика, `prompt.js` промпт, `guard.js` проверки, `time.js` время, `i18n.js` тексты ru/uk/de/en, `calendar.js`, `notify.js`, `channels/whatsapp.js`, `llm.js` (смена модели и провайдера), `index.js` Worker
- `engine/businesses/` примеры клиентов (выдуманные): салон, кафе, фитнес, офис, магазин, клиника
- `engine/apps-script/` мост к Google Календарю
- `engine/widget/` чат для сайта и демо-страница
- `autoreply/` тексты для приложения WhatsApp Business на 4 языках и генератор листа

## Источники (проверено 27.11.2026)

- Тарифы WhatsApp с 01.10.2026: https://help.twilio.com/articles/53100480177819 , https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-october-1-2026
- Официальная страница тарифов Meta (из моей среды не открылась): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Coexistence: https://docs.360dialog.com/partner/waba-management/phone-number-and-hosting/whatsapp-coexistence , https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- Запрет ботов общего назначения: https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/ , https://respond.io/blog/whatsapp-chatbot-policy-2026
- Meta Business Agent: https://www.techcrunch.com/2026/06/03/metas-ai-agent-for-whatsapp-business-is-now-available-globally/
- Instagram API доступ: https://developers.facebook.com/documentation/business-messaging/instagram-messaging/app-review/apps-for-other-businesses
- Автоматизации Business Suite: https://getkanal.com/blog/instagram-automatic-messages
- Google appointment schedules: https://support.google.com/calendar/answer/16287038
- AI Act ст. 50: https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force
- Anthropic DPA и хранение: https://www.anthropic.com/legal/data-processing-addendum , https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Cloudflare лимиты: https://developers.cloudflare.com/workers/platform/limits , https://developers.cloudflare.com/kv/platform/limits
- 360dialog: https://360dialog.com/pricing , изменения цен 2026: https://pricingsaas.com/companies/360dialog/diffs/2026Q2
- Плата за ответы с 01.10.2026 и ставка Германии (посредники): https://sendpulse.com/blog/whatsapp-service-message-pricing , https://chatarmin.com/en/blog/whatsapp-business-costs , https://keaz.app/whatsapp-facts , https://blckalpaca.at/en/knowledge-base/social-media/community-management-social-customer-care/whatsapp-business-customer-service-pricing (пишет, что у Meta бесплатного лимита нет)
- Coexistence в Германии: официального списка стран не нашёл; https://chatarmin.com/en/blog/what-is-a-whats-app-business-account-all-the-options-and-features-of-your-whats-app-business-account пишет, что в DE и AT выкатывается неравномерно, https://telnyx.com/release-notes/whatsapp-coexistence (приложение 2.24.17+)
