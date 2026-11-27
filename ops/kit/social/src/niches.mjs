/* Per niche: post themes to rotate, tone, and hard rules the caption must follow.
   Themes are hints for the model; a photo note from the owner always wins over the theme. */

export const NICHES = {
  salon: {
    label: "beauty salon (nails, hair, massage)",
    themes: [
      ["work", "Show the finished work in the photo: colour, shape, style. One sentence about it."],
      ["free_slot", "Announce a free slot the owner gave (day and time). Only if a free slot is given."],
      ["care_tip", "A short care tip that fits the photo (for example how to keep nails shiny). No medical claims."],
      ["season", "Seasonal idea (colours or styles of the month) tied to the photo."],
    ],
    rules: [
      "Never promise medical or skin-health effects.",
      "Do not name or describe a client unless the note says she agreed.",
    ],
    hashtags_hint: "city plus service, for example #nailsberlin",
  },
  cafe: {
    label: "cafe or restaurant",
    themes: [
      ["dish", "Show the dish or drink in the photo, say what it is, price only if given."],
      ["new", "What is new this week (menu, opening hours, event), from the note."],
      ["place", "The place itself: terrace, room, team. Invite to drop in."],
      ["season", "Seasonal item from the note."],
    ],
    rules: [
      "Never invent dishes, ingredients, prices or opening hours. Use only the note and facts.",
      "No allergen or diet claims (vegan, gluten-free) unless the note says so word for word.",
    ],
    hashtags_hint: "city plus food, for example #kölnbrunch",
  },
  shop: {
    label: "local shop",
    themes: [
      ["new_stock", "New arrival in the photo: what it is, sizes or colours, price if given."],
      ["pick", "Owner's pick of the week."],
      ["gift", "Gift idea that fits the item and the season."],
      ["store", "The shop itself, opening hours from facts, invite to come by."],
    ],
    rules: [
      "Prices only from the note or facts. If a price is given, write it exactly as given.",
      "Do not say 'only today', 'last pieces' or 'sale' unless the note says it (UWG: no fake urgency).",
    ],
    hashtags_hint: "city plus shop type",
  },
  fitness: {
    label: "fitness studio or personal trainer",
    themes: [
      ["exercise", "Short tip about the exercise in the photo or clip (one cue, safe form)."],
      ["member", "A member milestone from the note. Only if the note says the member agreed to be shown."],
      ["class", "A class or trial session from facts: day and time only if given."],
      ["motivation", "Short motivation tied to the photo, no body shaming."],
    ],
    rules: [
      "No guaranteed results, no weight-loss promises, no medical claims.",
      "Member results (kg, before/after) only if the note gives them and says the member agreed; add 'individual result'.",
    ],
    hashtags_hint: "city plus training type",
  },
  other: {
    label: "small local business",
    themes: [
      ["work", "Show the work or product in the photo."],
      ["new", "What is new this week, from the note."],
      ["team", "Behind the scenes or team, only from the note."],
      ["info", "Practical info from facts (hours, how to book)."],
    ],
    rules: ["Never invent facts, prices or opening hours."],
    hashtags_hint: "city plus trade",
  },
};

export const LANG_NAMES = { de: "German", en: "English", ru: "Russian", uk: "Ukrainian" };

/* Call to action lines. {hours} from facts. Links in Instagram captions are not clickable,
   so the WhatsApp line points to the button or link in the profile (Mikhail sets it up once). */
export const CTA = {
  whatsapp: {
    de: "Schreib uns auf WhatsApp, der Button ist im Profil.",
    en: "Message us on WhatsApp, the button is in our profile.",
    ru: "Пишите нам в WhatsApp, кнопка в профиле.",
    uk: "Пишіть нам у WhatsApp, кнопка в профілі.",
  },
  visit: {
    de: "Komm vorbei! {hours}",
    en: "Drop by! {hours}",
    ru: "Заходите! {hours}",
    uk: "Заходьте! {hours}",
  },
  link: {
    de: "Termin über den Link im Profil",
    en: "Book via the link in our bio",
    ru: "Запись по ссылке в профиле",
    uk: "Запис за посиланням у профілі",
  },
};

/* Words that must not appear in any caption (UWG, HWG-like claims, fake urgency). Lowercase match. */
export const BANNED = {
  all: ["garantiert", "guaranteed", "гарантир", "гарантов", "beste der stadt", "best in town", "лучший в городе", "найкращий у місті", "nr. 1", "no. 1"],
  fitness: ["abnehmen in", "lose weight in", "похудеешь за", "схуднеш за", "fettverbrennung garantiert", "heilt", "cures"],
  salon: ["heilt", "cures", "лечит", "лікує", "anti-aging garantie"],
  cafe: [],
  shop: ["nur heute", "only today", "только сегодня", "лише сьогодні"],
  other: [],
};
