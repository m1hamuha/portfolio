#!/usr/bin/env node
/* Google Business Profile fill sheet: what to type into which field, from the same business.json as the site.
   node gbp/checklist.mjs <business.json> [--out gbp.md]
   Mikhail works through it as manager of the profile (business.google.com or Google Maps app > Your business).
   Also lints the things Google rejects or suspends for: keyword stuffing in the name, links and phone numbers
   in the description, description over 750 characters. */
import fs from "node:fs";
import { DAYS, phoneDigits, mapsHref } from "../lib/render.mjs";
import { t } from "../lib/i18n.mjs";

const DAY_DE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const CATEGORY_HINT = {
  salon: ["Nagelstudio", "Friseursalon", "Kosmetikstudio"], cafe: ["Café", "Restaurant", "Bäckerei"], shop: ["(Art des Geschäfts) z. B. Tierbedarfsgeschäft, Lebensmittelgeschäft"],
  trades: ["Elektriker", "Klempner", "Malerbetrieb"], fitness: ["Fitnessstudio", "Yogastudio", "Personal Trainer"], clinic: ["Zahnarzt", "Arzt", "Physiotherapeut"],
  cleaning: ["Reinigungsdienst", "Gebäudereinigung"], other: ["(passende Kategorie in Google suchen)"],
};
const STUFFING = /\b(best|beste[rns]?|günstig|billig|cheap|top|nr\.? ?1|24\/7|in der nähe|near me)\b/i;

export function lint(biz) {
  const out = [];
  const a = biz.address || {};
  if (STUFFING.test(biz.name)) out.push("name: looks like keywords. Use the exact name on the door and invoices, nothing else (Google suspends stuffed names)");
  if (a.city && biz.name.toLowerCase().includes(a.city.toLowerCase()) && !(biz.gbp && biz.gbp.city_in_real_name)) out.push("name: contains the city. Only OK if it is part of the real name (set gbp.city_in_real_name)");
  const desc = t((biz.gbp || {}).description, "de");
  if (desc.length > 750) out.push(`description: ${desc.length} characters, Google allows 750`);
  if (/https?:\/\/|www\.|\.(de|com)\b/i.test(desc)) out.push("description: no links in the description");
  if (/\+?\d[\d \/-]{6,}\d/.test(desc)) out.push("description: no phone numbers in the description");
  if (/%|rabatt|sale|angebot|discount/i.test(desc)) out.push("description: no offers or discounts in the description, use posts or the site");
  if (biz.niche === "clinic" && /(garantiert|schmerzfrei|beste|heilt|guarantee)/i.test(desc)) out.push("clinic: no promises of results (HWG)");
  if (!desc) out.push("description: empty, write 2 to 4 plain sentences (what, for whom, where, languages)");
  return out;
}

export function sheet(biz) {
  const g = biz.gbp || {}, a = biz.address || {}, L = (v) => t(v, "de", biz.lang);
  const site = biz.base_url ? biz.base_url.replace(/\/?$/, "/") + "?utm_source=google&utm_medium=organic&utm_campaign=gbp" : "(no site yet: leave empty or put the site later)";
  const hours = DAYS.map((d, i) => `| ${DAY_DE[i]} | ${(biz.hours && biz.hours[d] && biz.hours[d].length) ? biz.hours[d].join(", ") : "geschlossen"} |`).join("\n");
  const items = (biz.prices || []).flatMap((gr) => (gr.items || []).map((it) => `| ${L(gr.group) || "-"} | ${L(it.name)} | ${typeof it.price === "object" ? L(it.price) : it.price}${it.from ? " (ab)" : ""} |`)).join("\n");
  const wa = biz.whatsapp ? "https://wa.me/" + phoneDigits(biz.whatsapp, biz.country_code) : "";
  const problems = lint(biz);
  return [
    `# Google Business Profile: ${biz.name}`, "",
    problems.length ? "## FIX FIRST\n\n" + problems.map((p) => "- " + p).join("\n") + "\n" : "Lint: OK\n",
    "## 0. Access and verification",
    "- [ ] Owner adds Mikhail's work Google account as **Manager** (Business Profile > menu > Business Profile settings > People and access). No password is shared.",
    "- [ ] No profile yet: the OWNER creates it on a call from his own Google account (business.google.com/create), Mikhail guides. Verification is chosen by Google: usually a short video on the phone (sign at the door, the premises or the work van, a tool or document that shows the owner runs the business), sometimes SMS or a call. Review takes up to about 5 working days.",
    "- [ ] Existing profile owned by somebody else (old agency, former owner): request access in Business Profile, the current owner has 7 days to answer (not verified today).", "",
    "## 1. Name, category, contact",
    `| Field | Value |\n|---|---|\n| Business name | ${biz.name} |\n| Primary category | ${g.category || (CATEGORY_HINT[biz.niche] || []).join(" / ")} |\n| Additional categories | ${(g.extra_categories || []).join(", ") || "-"} |\n| Phone | +${phoneDigits(biz.phone, biz.country_code)} |\n| Website | ${site} |\n| Chat (WhatsApp) | ${wa || "-"} (Edit profile > Contact > Chat. Only shown in some countries: if the field is missing, put the wa.me link on the site instead) |\n| Address | ${biz.hide_address ? "hide (service-area business), enter it only for verification" : [a.street, a.zip, a.city].filter(Boolean).join(", ")} |\n| Service area | ${(biz.service_area || []).join(", ") || "-"} |`, "",
    "## 2. Opening hours",
    "| Day | Hours |\n|---|---|\n" + hours,
    biz.closed_note ? `\nSpecial hours / holidays: ${L(biz.closed_note)} (enter as "Special hours", not by changing normal hours)` : "", "",
    "## 3. Description (max 750 characters)", "", L(g.description) || "(write it)", "",
    "## 4. Services / products / menu with prices",
    items ? "| Group | Item | Price (EUR) |\n|---|---|---|\n" + items : "(none)",
    biz.niche === "cafe" ? "\nCafe: also set the menu link (Edit profile > Menu) to the site section #prices or a PDF. Google may also show a menu from photos." : "", "",
    "## 5. Photos (from the client's phone, JPG or PNG)",
    "- [ ] Logo (square) and cover photo",
    "- [ ] 3 or more: outside with the sign (helps people find the door), inside, work or products",
    "- [ ] No stock photos, no text or logos stamped over photos, no photos of customers without their consent",
    biz.niche === "clinic" ? "- [ ] Clinic: no patients, no before/after, nothing that shows a treatment result" : "",
    "- Google's help names JPG or PNG, 10 KB to 5 MB, at least 250 x 250 px, recommended 720 x 720 px (from Google help, not re-checked today).", "",
    "## 6. After saving",
    "- [ ] Check on Google Maps from a phone that is not logged in (edits can take from minutes to a few days, some go to review)",
    "- [ ] Send the owner a screenshot and the review link (reviews kit)",
    `- [ ] Maps link for the owner: ${mapsHref(biz)}`,
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function arg(n) { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) { console.error("usage: checklist.mjs <business.json> [--out gbp.md]"); process.exit(2); }
  const biz = JSON.parse(fs.readFileSync(file, "utf8"));
  const md = sheet(biz);
  const out = arg("--out");
  if (out) { fs.writeFileSync(out, md); console.log("wrote", out); } else console.log(md);
}
