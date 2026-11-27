/* Paste sheet for the free WhatsApp Business app (greeting, away message, quick replies).
   Usage: node build.mjs examples/trades-example.json > sheet.txt
   Same business.json format as the engine; only "autoreply" fields are extra. No network. */
import fs from "node:fs";

const TPL = JSON.parse(fs.readFileSync(new URL("./templates.json", import.meta.url), "utf8"));
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DN = {
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], uk: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
};
const FROM = { de: "ab ", en: "from ", ru: "от ", uk: "від " };
const LINK = { de: "\nOnline: ", en: "\nOnline: ", ru: "\nОнлайн: ", uk: "\nОнлайн: " };

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
    const p = String(s.price).replace(".", lang === "en" ? "." : ",");
    return `- ${n}: ${s.price_from ? FROM[lang] : ""}${p} ${cur}`;
  }).join("\n");
}

export function fill(tpl, biz, lang) {
  const a = biz.autoreply || {};
  const v = {
    name: biz.name, hours: hoursLine(biz.hours, lang), prices: pricesBlock(biz, lang),
    link: (biz.booking && biz.booking.link) || a.link || "", callback: (a.callback || {})[lang] || "",
    areas: (a.areas || []).join(", "), next_open: (a.next_open || {})[lang] || "",
    link_line: a.link ? LINK[lang] + a.link : "",
  };
  return tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "").replace(/[\u2013\u2014]/g, "-");
}

export function sheet(biz) {
  const niche = TPL[biz.niche] || TPL.other;
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
  out.push("## Quick replies (Business tools > Quick replies)");
  for (const [k, by] of Object.entries(TPL.quick)) {
    if (k === "termin" && !((biz.booking && biz.booking.link) || (biz.autoreply || {}).link)) continue;
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
