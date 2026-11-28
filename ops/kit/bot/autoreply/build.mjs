/* Paste sheet for the free WhatsApp Business app (greeting, away message, quick replies),
   plus Instagram (Meta Business Suite) and the WhatsApp catalog list when the config asks for them.
   Usage: node build.mjs examples/trades-example.json > sheet.txt
   Same business.json format as the engine; only "autoreply" fields are extra. No network.
   autoreply: { link, channels: ["whatsapp","instagram"], catalog: true, callback, areas, next_open,
                timetable: { de, en, ru, uk } (class times, fitness) } */
import fs from "node:fs";

const TPL = JSON.parse(fs.readFileSync(new URL("./templates.json", import.meta.url), "utf8"));
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DN = {
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], uk: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
};
const FROM = { de: "ab ", en: "from ", ru: "от ", uk: "від " };
const FREE = { de: "gratis", en: "free", ru: "бесплатно", uk: "безкоштовно" };
// The site promises a booking link for these niches (level B), so a sheet without one is an error.
export const NEED_LINK = ["salon", "fitness", "other"];
const LINK = { de: "\nOnline: ", en: "\nOnline: ", ru: "\nОнлайн: ", uk: "\nОнлайн: " };
const TT = { de: "\nKurse: ", en: "\nClasses: ", ru: "\nГруппы: ", uk: "\nГрупи: " };

export function money(price, lang) {
  const n = Number(price);
  const t = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return lang === "en" ? t : t.replace(".", ",");
}

export function hoursLine(hours, lang) {
  const groups = [];
  DAYS.forEach((d, i) => {
    const v = (hours[d] || []).join(", ");
    if (!v) return;
    const g = groups[groups.length - 1];
    if (g && g.v === v && g.end === i - 1) g.end = i; else groups.push({ v, start: i, end: i });
  });
  return groups.map((g) => `${DN[lang][g.start]}${g.end > g.start ? "-" + DN[lang][g.end] : ""} ${g.v}`).join("; ");
}

export function pricesBlock(biz, lang) {
  const cur = biz.currency === "EUR" || !biz.currency ? "€" : biz.currency;
  return (biz.services || []).filter((s) => s.price != null).map((s) => {
    const n = typeof s.name === "string" ? s.name : s.name[lang] || s.name.en;
    if (Number(s.price) === 0) return `- ${n}: ${FREE[lang]}`;
    return `- ${n}: ${s.price_from ? FROM[lang] : ""}${money(s.price, lang)} ${cur}`;
  }).join("\n");
}

export function fill(tpl, biz, lang) {
  const a = biz.autoreply || {};
  const v = {
    name: biz.name, hours: hoursLine(biz.hours, lang), prices: pricesBlock(biz, lang),
    link: (biz.booking && biz.booking.link) || a.link || "", callback: (a.callback || {})[lang] || "",
    areas: (a.areas || []).join(", "), next_open: (a.next_open || {})[lang] || "",
    link_line: a.link ? LINK[lang] + a.link : "",
    timetable_line: (a.timetable || {})[lang] ? TT[lang] + a.timetable[lang] : "",
  };
  return tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "").replace(/[\u2013\u2014]/g, "-");
}

export function bookingLink(biz) {
  return (biz.booking && biz.booking.link) || (biz.autoreply || {}).link || "";
}

export function checkConfig(biz) {
  const errors = [];
  const niche = biz.niche || "other";
  if (NEED_LINK.includes(niche) && !/^https:\/\//.test(bookingLink(biz)))
    errors.push(`${biz.id || biz.name}: niche "${niche}" needs autoreply.link (https booking page: Google appointment schedule or Cal.com)`);
  if (niche === "shop" && !(biz.services || []).some((s) => s.price != null))
    errors.push(`${biz.id || biz.name}: shop needs services with prices for the WhatsApp catalog`);
  return errors;
}

export function catalogBlock(biz) {
  const lang = biz.default_lang || "de";
  return (biz.services || []).filter((s) => s.price != null).map((s) => {
    const n = typeof s.name === "string" ? s.name : s.name[lang] || s.name.en;
    return `- ${n} | ${Number(s.price) === 0 ? FREE[lang] : money(s.price, lang) + " €"}${s.price_from ? " (" + FROM[lang].trim() + ")" : ""}`;
  }).join("\n");
}

export function sheet(biz) {
  const errors = checkConfig(biz);
  if (errors.length) throw new Error(errors.join("\n"));
  const niche = TPL[biz.niche] || TPL.other;
  const a = biz.autoreply || {};
  const out = [`# ${biz.name}: WhatsApp Business app texts`, ""];
  for (const kind of ["greeting", "away"]) {
    if (!niche[kind]) continue;
    out.push(`## ${kind === "greeting" ? "Greeting message (Business tools > Greeting message; send to: people not in your contacts)" : "Away message (Business tools > Away message; schedule: outside of business hours)"}`);
    for (const l of biz.languages || ["de"]) {
      if (!niche[kind][l]) continue;
      const text = fill(niche[kind][l], biz, l);
      out.push(`### ${l} (${text.length} chars)`, text, "");
    }
  }
  if ((a.channels || []).includes("instagram")) {
    const kind = niche.away ? "away" : "greeting";
    out.push("## Instagram (Meta Business Suite > Inbox > Automations: Instant reply and Away message, same text)");
    out.push("Instagram requests stay in the Instagram inbox (Business Suite app), they do not move to WhatsApp.");
    for (const l of biz.languages || ["de"]) {
      if (!niche[kind][l]) continue;
      const text = fill(niche[kind][l], biz, l).replace(/\n?[^\n]*\((Symbol oben im Chat|icon at the top of this chat|значок вверху чата|значок угорі чату)\)\.?/g, "");
      out.push(`### instagram ${l} (${text.length} chars)`, text, "");
    }
  }
  if (a.catalog || biz.niche === "shop") {
    out.push("## WhatsApp catalog (Business tools > Catalog: one item per line, name | price)", catalogBlock(biz), "");
  }
  out.push("## Quick replies (Business tools > Quick replies)");
  for (const [k, by] of Object.entries(TPL.quick)) {
    if (k === "termin" && !bookingLink(biz)) continue;
    if (k === "preis" && !(biz.services || []).some((s) => s.price != null)) continue;
    for (const l of biz.languages || ["de"]) out.push(`/${k}${l === (biz.default_lang || "de") ? "" : "_" + l}: ${fill(by[l], biz, l)}`);
  }
  out.push("", "One message can hold only one language: put the main language first, or the two most used ones one under the other.");
  return out.join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("build.mjs")) {
  const file = process.argv[2];
  if (!file) { console.error("usage: node build.mjs business.json"); process.exit(1); }
  console.log(sheet(JSON.parse(fs.readFileSync(file, "utf8"))));
}
