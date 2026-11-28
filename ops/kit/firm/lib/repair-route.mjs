/* Repair reports to the right tradesman, after one tap by the property manager.
   A tenant fills the form (category, address, unit, text, photos, "the tradesman may call me" yes or no).
   route() picks the tradesman from the config and prepares the e-mail; nothing is sent yet.
   The manager gets an approval link; approve() checks the signed token and only then the caller sends the draft.
   Config (JSON, no secrets):
     { "lang": "de", "manager": { "email": "verwaltung@firm.example" },
       "categories": [ { "id": "water", "words": ["wasser", "rohr", "leak"], "tradesman": { "name": "...", "email": "..." } } ] }
   Secret for signing: env ROUTE_SECRET. Tenant phone and name go to the tradesman only if the tenant agreed. */

import { createHmac, timingSafeEqual } from "node:crypto";

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data, secret) => createHmac("sha256", secret).update(data).digest("base64url");

export function pickCategory(cfg, report) {
  const byId = cfg.categories.find((c) => c.id === report.category);
  if (byId) return byId;
  const t = String(report.text || "").toLowerCase();
  return cfg.categories.find((c) => (c.words || []).some((w) => t.includes(String(w).toLowerCase()))) || null;
}

const SUBJ = { de: "Reparaturauftrag", en: "Repair request", uk: "Заявка на ремонт", ru: "Заявка на ремонт" };
const LBL = {
  de: { addr: "Adresse", unit: "Wohnung", what: "Schaden", photos: "Fotos", contact: "Kontakt Mieter", noContact: "Termin bitte über die Verwaltung" },
  en: { addr: "Address", unit: "Unit", what: "Damage", photos: "Photos", contact: "Tenant contact", noContact: "Please arrange the visit through the property manager" },
  uk: { addr: "Адреса", unit: "Квартира", what: "Що сталося", photos: "Фото", contact: "Контакт мешканця", noContact: "Час візиту через управителя" },
  ru: { addr: "Адрес", unit: "Квартира", what: "Что случилось", photos: "Фото", contact: "Контакт жильца", noContact: "Время визита через управляющего" },
};

export function route(cfg, report, { secret = process.env.ROUTE_SECRET, now = Date.now(), ttlHours = 72 } = {}) {
  if (!secret) throw new Error("ROUTE_SECRET missing");
  const lang = LBL[cfg.lang] ? cfg.lang : "de";
  const l = LBL[lang];
  const cat = pickCategory(cfg, report);
  const to = cat ? cat.tradesman.email : cfg.manager.email;
  const body = [
    `${l.addr}: ${report.address || ""}`,
    report.unit ? `${l.unit}: ${report.unit}` : null,
    `${l.what}: ${report.text || ""}`,
    report.photos?.length ? `${l.photos}: ${report.photos.join(" ")}` : null,
    report.contactOk ? `${l.contact}: ${[report.name, report.phone].filter(Boolean).join(", ")}` : l.noContact,
  ].filter(Boolean).join("\n");
  const draft = { to, subject: `${SUBJ[lang]}: ${report.address || ""}${report.unit ? `, ${report.unit}` : ""}`, body };
  const payload = b64(JSON.stringify({ id: report.id, to, exp: now + ttlHours * 3600e3 }));
  return { category: cat ? cat.id : null, needsManager: !cat, draft, token: `${payload}.${sign(payload, secret)}` };
}

export function approvalLink(baseUrl, token) {
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}approve=${encodeURIComponent(token)}`;
}

/* used: ids already sent (a Set, or the "sent" column of the sheet). A second tap on the same link does not send twice. */
export function approve(token, { secret = process.env.ROUTE_SECRET, now = Date.now(), used = null } = {}) {
  if (!secret) throw new Error("ROUTE_SECRET missing");
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return { ok: false, reason: "bad token" };
  const a = Buffer.from(sig), b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad signature" };
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.exp < now) return { ok: false, reason: "expired" };
  if (used && used.has(data.id)) return { ok: false, reason: "already sent" };
  return { ok: true, id: data.id, to: data.to };
}
