/* One-page site from business.json. Pure functions, no network, no external fonts, scripts or maps
   (no Google Fonts and no embedded Google Map: nothing that needs a cookie banner). */
import crypto from "node:crypto";
import { UI, LANGS, t } from "./i18n.mjs";

export const DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];
const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SCHEMA_TYPE = { salon: "BeautySalon", cafe: "CafeOrCoffeeShop", shop: "Store", trades: "HomeAndConstructionBusiness", fitness: "ExerciseGym", clinic: "MedicalClinic", cleaning: "ProfessionalService", other: "LocalBusiness" };

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function phoneDigits(phone, cc = "49") {
  let s = String(phone || "").replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
  if (s.startsWith("+")) return s.slice(1);
  if (s.startsWith("00")) return s.slice(2);
  if (s.startsWith("0")) return cc + s.slice(1);
  return s;
}
export const telHref = (biz) => "tel:+" + phoneDigits(biz.phone, biz.country_code);
export const waHref = (biz, text) => "https://wa.me/" + phoneDigits(biz.whatsapp || biz.phone, biz.country_code) + (text ? "?text=" + encodeURIComponent(text) : "");

export function mapsHref(biz) {
  if (biz.maps_url) return biz.maps_url;
  if (biz.place_id) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(biz.name) + "&query_place_id=" + encodeURIComponent(biz.place_id);
  const a = biz.address || {};
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([biz.name, a.street, a.zip, a.city].filter(Boolean).join(" "));
}

/* ---------- checks before build ---------- */
const TIME = /^([01]\d|2[0-4]):[0-5]\d-([01]\d|2[0-4]):[0-5]\d$/;

export function validate(biz) {
  const errors = [], warnings = [];
  for (const k of ["id", "name", "phone"]) if (!biz[k]) errors.push(`missing ${k}`);
  if (biz.id && !/^[a-z0-9-]+$/.test(biz.id)) errors.push("id: only a-z, 0-9 and -");
  const langs = biz.langs || [biz.lang || "de"];
  for (const l of langs) if (!LANGS.includes(l)) errors.push(`language ${l} not supported`);
  for (const [d, spans] of Object.entries(biz.hours || {})) {
    if (!DAYS.includes(d)) errors.push(`hours: unknown day ${d}`);
    for (const s of spans || []) if (!TIME.test(s)) errors.push(`hours ${d}: "${s}" must look like 09:00-18:00`);
  }
  if (!biz.hide_address && !(biz.address && biz.address.street && biz.address.city)) errors.push("address.street and address.city needed (or hide_address for service-area businesses)");
  const legal = biz.legal || {};
  for (const k of ["owner_name", "email"]) if (!legal[k]) warnings.push(`legal.${k} missing: Impressum is incomplete`);
  if (!legal.address && biz.hide_address) warnings.push("legal.address missing: Impressum needs a postal address even if the map hides it");
  if (biz.niche === "clinic") {
    if (!legal.chamber || !legal.profession) warnings.push("clinic: Impressum needs chamber, professional title and the country where it was granted");
    if ((biz.photos || []).some((p) => /before|after|vorher|nachher/i.test(p.file + " " + JSON.stringify(p.alt || "")))) warnings.push("clinic: before/after photos are risky under HWG §11, leave them out");
    if (biz.booking && biz.booking.enabled) warnings.push("clinic: no booking form with free text (patients write symptoms). Use phone or the practice's booking service");
  }
  if (biz.booking && biz.booking.enabled && !biz.booking.endpoint) errors.push("booking.endpoint missing (deploy apps-script/Site.gs as web app)");
  for (const g of biz.prices || []) for (const it of g.items || []) if (it.price == null || it.price === "") warnings.push(`price missing for ${t(it.name, "de")}`);
  return { errors, warnings };
}

/* ---------- pieces ---------- */
function money(v, lang) {
  if (typeof v === "number") return new Intl.NumberFormat(lang === "en" ? "en-IE" : lang, { style: "currency", currency: "EUR", maximumFractionDigits: v % 1 ? 2 : 0 }).format(v).replace(/ /g, " ");
  return String(v);
}

function pricesHtml(biz, lang, U) {
  if (!biz.prices || !biz.prices.length) return "";
  const groups = biz.prices.map((g) => {
    const rows = (g.items || []).map((it) => `<tr><td>${esc(t(it.name, lang, biz.lang))}${it.note ? `<small>${esc(t(it.note, lang, biz.lang))}</small>` : ""}</td><td class="p">${it.from ? esc(U.from) + " " : ""}${esc(money(typeof it.price === "object" ? t(it.price, lang, biz.lang) : it.price, lang))}</td></tr>`).join("");
    return `${g.group ? `<h3>${esc(t(g.group, lang, biz.lang))}</h3>` : ""}<table>${rows}</table>`;
  }).join("");
  return `<section id="prices"><h2>${esc(U.prices)}</h2><div id="price-list">${groups}</div>${biz.prices_vat_note === false ? "" : `<p class="note">${esc(U.pricesNote)}</p>`}</section>`;
}

function hoursHtml(biz, lang, U) {
  if (!biz.hours) return "";
  const rows = DAYS.map((d, i) => `<tr data-day="${i}"><td>${esc(U.days[i])}</td><td>${(biz.hours[d] || []).length ? biz.hours[d].map((s) => esc(s.replace("-", " - "))).join(", ") : esc(U.closed)}</td></tr>`).join("");
  const note = biz.closed_note ? `<p class="note">${esc(t(biz.closed_note, lang, biz.lang))}</p>` : "";
  return `<section id="hours"><h2>${esc(U.hours)}</h2><p id="open-now" class="badge" hidden></p><table>${rows}</table>${note}</section>`;
}

function photosHtml(biz, lang, U, prefix) {
  if (!biz.photos || !biz.photos.length) return "";
  const imgs = biz.photos.map((p) => `<img src="${prefix}img/${esc(p.file.split("/").pop())}" alt="${esc(t(p.alt, lang, biz.lang))}" loading="lazy" width="600" height="450">`).join("");
  return `<section id="photos"><h2>${esc(U.photos)}</h2><div class="grid">${imgs}</div></section>`;
}

function bookingHtml(biz, lang, U, prefix) {
  const b = biz.booking;
  if (!b || !b.enabled) return "";
  const slots = (b.slots || []).map((s) => `<option>${esc(t(s, lang, biz.lang))}</option>`).join("");
  return `<section id="book"><h2>${esc(t(b.title, lang, biz.lang) || U.book)}</h2>` +
    `<form id="book-form" method="post" action="${esc(b.endpoint)}">` +
    `<input type="hidden" name="client" value="${esc(biz.id)}"><input type="hidden" name="lang" value="${lang}">` +
    `<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>` +
    `<label>${esc(U.name)}<input name="name" required maxlength="80" autocomplete="name"></label>` +
    `<label>${esc(U.phone)}<input name="phone" required maxlength="40" type="tel" autocomplete="tel"></label>` +
    (slots ? `<label>${esc(U.slot)}<select name="slot">${slots}</select></label>` : `<label>${esc(U.slot)}<input name="slot" maxlength="80"></label>`) +
    `<label>${esc(U.message)}<textarea name="message" maxlength="500" rows="3"></textarea></label>` +
    `<label class="ck"><input type="checkbox" name="consent" value="yes" required> <span>${esc(U.consent)} <a href="${prefix}datenschutz.html">${esc(U.privacy)}</a>.</span></label>` +
    `<button type="submit">${esc(U.send)}</button><p id="book-msg" role="status"></p></form></section>`;
}

/* small script: open-now badge, live prices, booking without page reload. Same text for every page, so one CSP hash. */
export const PAGE_JS = `(function(){
var d=document.documentElement.dataset,H=JSON.parse(d.hours||"null"),U=JSON.parse(d.ui);
function now(tz){var p={};new Intl.DateTimeFormat("en-GB",{timeZone:tz,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});return{day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(p.weekday),min:+p.hour*60+ +p.minute}}
if(H){var n=now(d.tz||"Europe/Berlin"),k=["mo","tu","we","th","fr","sa","su"][n.day],el=document.getElementById("open-now"),until=null;
(H[k]||[]).forEach(function(s){var a=s.split("-"),f=a[0].split(":"),t=a[1].split(":"),fm=+f[0]*60+ +f[1],tm=+t[0]*60+ +t[1];if(n.min>=fm&&n.min<tm)until=a[1]});
if(el){el.textContent=until?U.openUntil+" "+until:U.closedNow;el.className="badge "+(until?"open":"shut");el.hidden=false}
var row=document.querySelector('tr[data-day="'+n.day+'"]');if(row)row.className="today"}
if(d.pricesUrl){fetch(d.pricesUrl+(d.pricesUrl.indexOf("?")<0?"?":"&")+"prices=1").then(function(r){return r.json()}).then(function(j){
if(!j||!j.groups||!j.groups.length)return;var box=document.getElementById("price-list"),h="";
j.groups.forEach(function(g){h+=(g.group?"<h3></h3>":"")+"<table></table>"});box.innerHTML=h;
var hs=box.querySelectorAll("h3"),ts=box.querySelectorAll("table"),hi=0;j.groups.forEach(function(g,i){if(g.group)hs[hi++].textContent=g.group;
g.items.forEach(function(it){var tr=document.createElement("tr"),a=document.createElement("td"),b=document.createElement("td");a.textContent=it.name;b.className="p";b.textContent=(it.from?U.from+" ":"")+it.price;tr.appendChild(a);tr.appendChild(b);ts[i].appendChild(tr)})})}).catch(function(){})}
var f=document.getElementById("book-form");if(f)f.addEventListener("submit",function(e){e.preventDefault();var m=document.getElementById("book-msg"),btn=f.querySelector("button");btn.disabled=true;
var q=new URLSearchParams(new FormData(f));q.append("ajax","1");
fetch(f.action,{method:"POST",body:q}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){m.textContent=U.thanks;f.reset()}else{m.textContent=U.error}}).catch(function(){m.textContent=U.error}).then(function(){btn.disabled=false})});
})();`;

export const PAGE_JS_HASH = "sha256-" + crypto.createHash("sha256").update(PAGE_JS).digest("base64");

const CSS = `:root{--c:#1a73e8;--bg:#fff;--fg:#151515;--mut:#5f6368}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;font:17px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--fg);background:var(--bg)}
main,header,footer{max-width:760px;margin:0 auto;padding:0 18px}header{padding-top:28px}
h1{font-size:2rem;line-height:1.15;margin:.2em 0}h2{font-size:1.35rem;margin:1.8em 0 .5em}h3{font-size:1.05rem;margin:1.2em 0 .3em;color:var(--mut)}
.tag{font-size:1.1rem;color:var(--mut);margin:0 0 1em}.cta{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
.cta a{flex:1 1 140px;text-align:center;padding:14px 10px;border-radius:12px;background:var(--c);color:#fff;text-decoration:none;font-weight:600}
.cta a.wa{background:#1f8f4e}.cta a.alt{background:#eef1f5;color:var(--fg)}
table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #eee;vertical-align:top}td.p{text-align:right;white-space:nowrap;font-weight:600;padding-left:12px}
td small{display:block;color:var(--mut);font-size:.85em}tr.today td{font-weight:700}
.badge{display:inline-block;padding:4px 10px;border-radius:99px;font-weight:600;font-size:.95rem}.open{background:#e3f6e8;color:#11622f}.shut{background:#fde8e8;color:#8a1c1c}
.note{color:var(--mut);font-size:.9rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}.grid img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px;background:#eee}
form label{display:block;margin:10px 0;font-weight:600}form input,form select,form textarea{display:block;width:100%;margin-top:4px;padding:11px;font:inherit;border:1px solid #c9ccd1;border-radius:10px}
form .ck{display:flex;gap:10px;font-weight:400;font-size:.92rem}form .ck input{width:auto;margin-top:4px}.hp{position:absolute;left:-9999px}
form button{padding:14px 22px;border:0;border-radius:12px;background:var(--c);color:#fff;font:inherit;font-weight:700}
footer{margin-top:48px;padding-bottom:40px;color:var(--mut);font-size:.9rem}footer a{color:inherit}nav.lang a{margin-right:10px}`;

function head(biz, lang, title, desc, prefix, extra = "") {
  const b = biz.booking && biz.booking.enabled ? new URL(biz.booking.endpoint).origin : "";
  const p = biz.prices_endpoint ? new URL(biz.prices_endpoint).origin : "";
  const connect = ["'self'", b, p, b || p ? "https://script.googleusercontent.com" : ""].filter(Boolean).join(" ");
  const csp = `default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src '${PAGE_JS_HASH}'; connect-src ${connect}; form-action 'self' ${b}; base-uri 'none'; frame-ancestors 'none'`.replace(/ +;/g, ";");
  return `<!doctype html><html lang="${lang}"${extra}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta http-equiv="Content-Security-Policy" content="${esc(csp)}"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}">` +
    `<meta name="referrer" content="strict-origin-when-cross-origin"><style>${CSS.replace("#1a73e8", esc(biz.color || "#1a73e8"))}</style>`;
}

export function jsonLd(biz, lang) {
  const a = biz.address || {};
  const ld = {
    "@context": "https://schema.org", "@type": biz.schema_type || SCHEMA_TYPE[biz.niche] || "LocalBusiness",
    name: biz.name, telephone: "+" + phoneDigits(biz.phone, biz.country_code),
    url: biz.base_url || undefined,
    description: t(biz.tagline, lang, biz.lang) || undefined,
    address: biz.hide_address ? { "@type": "PostalAddress", addressLocality: a.city, addressCountry: a.country || "DE" } :
      { "@type": "PostalAddress", streetAddress: a.street, postalCode: a.zip, addressLocality: a.city, addressCountry: a.country || "DE" },
    areaServed: biz.service_area && biz.service_area.length ? biz.service_area : undefined,
    openingHoursSpecification: biz.hours ? DAYS.flatMap((d, i) => (biz.hours[d] || []).map((s) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[i], opens: s.split("-")[0], closes: s.split("-")[1] }))) : undefined,
  };
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}

/* lang = page language; prefix = "" for the root page, "../" for /ru/ etc. */
export function renderPage(biz, lang) {
  const U = UI[lang], L = (v) => t(v, lang, biz.lang);
  const langs = biz.langs || [biz.lang || "de"];
  const main = biz.lang || langs[0];
  const prefix = lang === main ? "" : "../";
  const a = biz.address || {};
  const tag = L(biz.tagline);
  const title = biz.name + (a.city ? ", " + a.city : "");
  const cta = [
    `<a href="${esc(telHref(biz))}">${esc(U.call)}</a>`,
    biz.whatsapp ? `<a class="wa" href="${esc(waHref(biz, L(biz.whatsapp_text)))}">${esc(U.whatsapp)}</a>` : "",
    biz.booking && biz.booking.enabled ? `<a href="#book">${esc(L(biz.booking.button) || U.book)}</a>` : "",
    biz.hide_address ? "" : `<a class="alt" href="${esc(mapsHref(biz))}" rel="noopener">${esc(U.directions)}</a>`,
  ].join("");
  const alt = langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${prefix}${l === main ? "" : l + "/"}">`).join("");
  const switcher = langs.length > 1 ? `<nav class="lang" aria-label="${esc(U.lang)}">${langs.map((l) => (l === lang ? `<b>${l.toUpperCase()}</b>` : `<a href="${prefix}${l === main ? "" : l + "/"}" hreflang="${l}">${l.toUpperCase()}</a>`)).join(" ")}</nav>` : "";
  const area = biz.service_area && biz.service_area.length ? `<section id="area"><h2>${esc(U.area)}</h2><p>${esc(biz.service_area.join(", "))}</p></section>` : "";
  const addr = biz.hide_address ? "" : `<p>${esc(U.address)}: ${esc([a.street, [a.zip, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</p>`;
  const data = ` data-ui="${esc(JSON.stringify({ openUntil: U.openUntil, closedNow: U.closedNow, from: U.from, thanks: U.thanks, error: U.error }))}" data-tz="${esc(biz.timezone || "Europe/Berlin")}"` +
    (biz.hours ? ` data-hours="${esc(JSON.stringify(biz.hours))}"` : "") + (biz.prices_endpoint ? ` data-prices-url="${esc(biz.prices_endpoint)}"` : "");
  return head(biz, lang, title, tag || title, prefix, data) + alt +
    `<script type="application/ld+json">${jsonLd(biz, lang)}</script></head><body>` +
    `<header>${switcher}<h1>${esc(biz.name)}</h1>${tag ? `<p class="tag">${esc(tag)}</p>` : ""}<div class="cta">${cta}</div></header><main>` +
    (biz.about ? `<section id="about"><p>${esc(L(biz.about))}</p></section>` : "") +
    pricesHtml(biz, lang, U) + bookingHtml(biz, lang, U, prefix) + photosHtml(biz, lang, U, prefix) + hoursHtml(biz, lang, U) + area +
    `<section id="contact"><h2>${esc(U.contact)}</h2>${addr}<p><a href="${esc(telHref(biz))}">${esc(biz.phone)}</a>${biz.email ? ` · <a href="mailto:${esc(biz.email)}">${esc(biz.email)}</a>` : ""}</p></section>` +
    `</main><footer><a href="${prefix}impressum.html">Impressum</a> · <a href="${prefix}datenschutz.html">Datenschutz</a></footer>` +
    `<script>${PAGE_JS}</script></body></html>`;
}

/* ---------- German legal pages: TEMPLATES, not legal advice. Mikhail checks them with the client. ---------- */
export function impressumHtml(biz) {
  const g = biz.legal || {}, a = g.address || biz.address || {};
  const lines = [
    `<p>${esc(g.owner_name || "[Name des Inhabers]")}${g.legal_form ? ", " + esc(g.legal_form) : ""}<br>${esc(biz.name)}<br>${esc(a.street || "[Straße]")}<br>${esc((a.zip || "[PLZ]") + " " + (a.city || "[Ort]"))}</p>`,
    `<p>Telefon: ${esc(biz.phone)}<br>E-Mail: ${esc(g.email || "[E-Mail]")}</p>`,
    g.register ? `<p>Registereintrag: ${esc(g.register)}</p>` : "",
    g.vat_id ? `<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${esc(g.vat_id)}</p>` : "",
    g.chamber ? `<p>Zuständige Kammer: ${esc(g.chamber)}${g.profession ? "<br>Berufsbezeichnung: " + esc(g.profession) + (g.profession_country ? " (verliehen in " + esc(g.profession_country) + ")" : "") : ""}${g.rules ? "<br>Berufsrechtliche Regelungen: " + esc(g.rules) : ""}</p>` : "",
    g.supervisory ? `<p>Zuständige Aufsichtsbehörde: ${esc(g.supervisory)}</p>` : "",
    `<p>Verbraucherstreitbeilegung: Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
  ];
  return legalPage(biz, "Impressum", `<p>Angaben gemäß § 5 DDG</p>${lines.join("")}`);
}

export function datenschutzHtml(biz) {
  const g = biz.legal || {}, booking = biz.booking && biz.booking.enabled;
  const host = biz.hosting === "github" ? "GitHub Inc. (GitHub Pages), 88 Colin P. Kelly Jr. St, San Francisco, CA 94107, USA" : "Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA (Cloudflare Pages)";
  const parts = [
    `<h2>Verantwortlicher</h2><p>${esc(g.owner_name || "[Name]")}, ${esc(biz.name)}, ${esc((g.address || biz.address || {}).street || "")}, ${esc((g.address || biz.address || {}).city || "")}, E-Mail: ${esc(g.email || "[E-Mail]")}</p>`,
    `<h2>Hosting</h2><p>Diese Website wird bei ${esc(host)} gehostet. Beim Aufruf verarbeitet der Hoster technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser) in Server-Logs, um die Website sicher auszuliefern (Art. 6 Abs. 1 lit. f DSGVO). Mit dem Hoster besteht ein Vertrag zur Auftragsverarbeitung; die Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der Standardvertragsklauseln.</p>`,
    `<h2>Keine Cookies, kein Tracking</h2><p>Diese Website setzt keine Cookies, lädt keine externen Schriftarten und nutzt keine Analyse- oder Werbedienste. Links zu Google Maps und WhatsApp öffnen den jeweiligen Dienst erst nach Ihrem Klick; dort gelten dessen Datenschutzbestimmungen.</p>`,
    booking ? `<h2>Anfrageformular</h2><p>Wenn Sie das Formular absenden, werden Name, Telefonnummer, Wunschtermin und Nachricht an ein Google-Konto des Betreibers (Google Apps Script und Google Tabellen, Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Irland) übermittelt, dort gespeichert und per E-Mail an uns weitergeleitet, um Ihre Anfrage zu bearbeiten (Art. 6 Abs. 1 lit. b DSGVO). Wir löschen die Angaben ${esc(String(biz.booking.delete_after_days || 90))} Tage nach Abschluss der Anfrage, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>` : "",
    `<h2>Kontakt per Telefon, E-Mail oder WhatsApp</h2><p>Wenn Sie uns kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihres Anliegens (Art. 6 Abs. 1 lit. b DSGVO). Bei WhatsApp verarbeitet zusätzlich WhatsApp Ireland Ltd. Daten nach eigenen Bestimmungen.</p>`,
    `<h2>Ihre Rechte</h2><p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.</p>`,
    `<p>Stand: ${esc(biz.legal_date || new Date().toISOString().slice(0, 10))}</p>`,
  ];
  return legalPage(biz, "Datenschutzerklärung", parts.join(""));
}

function legalPage(biz, title, body) {
  return head(biz, "de", title + ": " + biz.name, title, "") + `<meta name="robots" content="noindex"></head><body><header><p><a href="./">← ${esc(biz.name)}</a></p><h1>${esc(title)}</h1></header><main>${body}</main></body></html>`;
}
