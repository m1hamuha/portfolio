/* "Where is my order?" for the website chat (bot kit widget) and the after-hours form. Read only.
   Config (JSON, no secrets):
     { "source": "shopify" | "woocommerce" | "csv",
       "shop": "example-shop" (shopify), "baseUrl": "https://shop.example" (woocommerce),
       "verify": "zip" | "email", "lang": "de", "statusText": { "<lang>": { "<code>": "text" } } (optional overrides) }
   Secrets only from env: SHOPIFY_TOKEN (Admin API, read_orders only), WC_KEY and WC_SECRET (read only key).
   csv: a daily export from any order system or ERP (columns order;zip;email;status;tracking), so firms without
   an API also get the function; the answer then says "as of" the export date.
   lookup() answers only when the order number AND the postcode or e-mail match. Otherwise "not found",
   with no hint whether the number exists. */

export const STATUS_TEXT = {
  en: { processing: "We are preparing your order.", shipped: "Your order is on its way.", partly_shipped: "Part of your order is on its way.", delivered: "Your order was delivered.", on_hold: "Your order is on hold. A colleague will contact you.", cancelled: "This order was cancelled.", unknown: "A colleague will check your order and get back to you.", notfound: "I could not find this order. Please check the number and postcode, or leave a message for the team." },
  de: { processing: "Deine Bestellung wird vorbereitet.", shipped: "Deine Bestellung ist unterwegs.", partly_shipped: "Ein Teil deiner Bestellung ist unterwegs.", delivered: "Deine Bestellung wurde zugestellt.", on_hold: "Deine Bestellung ist pausiert. Wir melden uns bei dir.", cancelled: "Diese Bestellung wurde storniert.", unknown: "Wir prüfen deine Bestellung und melden uns.", notfound: "Ich finde diese Bestellung nicht. Prüf bitte Nummer und Postleitzahl oder hinterlass eine Nachricht fürs Team." },
  uk: { processing: "Твоє замовлення готуємо.", shipped: "Твоє замовлення вже в дорозі.", partly_shipped: "Частина замовлення вже в дорозі.", delivered: "Замовлення доставлено.", on_hold: "Замовлення призупинено. Колега зв'яжеться з тобою.", cancelled: "Це замовлення скасовано.", unknown: "Колега перевірить замовлення і напише тобі.", notfound: "Не знаходжу це замовлення. Перевір номер та індекс або залиш повідомлення для команди." },
  ru: { processing: "Твой заказ готовим.", shipped: "Твой заказ уже в пути.", partly_shipped: "Часть заказа уже в пути.", delivered: "Заказ доставлен.", on_hold: "Заказ приостановлен. Коллега свяжется с тобой.", cancelled: "Этот заказ отменён.", unknown: "Коллега проверит заказ и напишет тебе.", notfound: "Не нахожу этот заказ. Проверь номер и индекс или оставь сообщение для команды." },
};

const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
const cleanNo = (s) => String(s ?? "").trim().replace(/^#/, "");

const SHOPIFY = { FULFILLED: "shipped", PARTIALLY_FULFILLED: "partly_shipped", UNFULFILLED: "processing", IN_PROGRESS: "processing", SCHEDULED: "processing", PENDING_FULFILLMENT: "processing", OPEN: "processing", ON_HOLD: "on_hold" };
const WOO = { pending: "processing", processing: "processing", "on-hold": "on_hold", completed: "shipped", cancelled: "cancelled", refunded: "cancelled", failed: "on_hold" };
const CSV = { offen: "processing", "in bearbeitung": "processing", versandt: "shipped", verschickt: "shipped", teilversandt: "partly_shipped", zugestellt: "delivered", storniert: "cancelled", pausiert: "on_hold",
  open: "processing", processing: "processing", shipped: "shipped", partly_shipped: "partly_shipped", delivered: "delivered", cancelled: "cancelled", on_hold: "on_hold" };

export function parseCsv(text) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => norm(h));
  return lines.slice(1).map((l) => {
    const cells = l.split(sep);
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

async function fromShopify(cfg, env, f, no) {
  if (!env.SHOPIFY_TOKEN) throw new Error("SHOPIFY_TOKEN missing");
  const query = `query($q:String!){orders(first:1,query:$q){nodes{name email cancelledAt displayFulfillmentStatus shippingAddress{zip} billingAddress{zip} fulfillments{trackingInfo{url}}}}}`;
  const res = await f(`https://${cfg.shop}.myshopify.com/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": env.SHOPIFY_TOKEN },
    body: JSON.stringify({ query, variables: { q: `name:#${no}` } }),
  });
  if (!res.ok) throw new Error(`shopify ${res.status}`);
  const o = (await res.json())?.data?.orders?.nodes?.[0];
  if (!o || cleanNo(o.name) !== no) return null;
  return {
    zip: o.shippingAddress?.zip || o.billingAddress?.zip, email: o.email,
    code: o.cancelledAt ? "cancelled" : SHOPIFY[o.displayFulfillmentStatus] || "unknown",
    tracking: (o.fulfillments || []).flatMap((x) => x.trackingInfo || []).map((t) => t.url).find(Boolean) || "",
  };
}

async function fromWoo(cfg, env, f, no) {
  if (!env.WC_KEY || !env.WC_SECRET) throw new Error("WC_KEY or WC_SECRET missing");
  if (!/^\d+$/.test(no)) return null;
  const auth = Buffer.from(`${env.WC_KEY}:${env.WC_SECRET}`).toString("base64");
  const res = await f(`${cfg.baseUrl.replace(/\/$/, "")}/wp-json/wc/v3/orders/${no}`, { headers: { authorization: `Basic ${auth}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`woocommerce ${res.status}`);
  const o = await res.json();
  const items = (o.meta_data || []).find((m) => m.key === "_wc_shipment_tracking_items")?.value || [];
  return {
    zip: o.shipping?.postcode || o.billing?.postcode, email: o.billing?.email,
    code: WOO[o.status] || "unknown", tracking: items[0]?.tracking_link || "",
  };
}

function fromCsv(cfg, no) {
  const row = parseCsv(cfg.csvText || "").find((r) => cleanNo(r.order) === no);
  if (!row) return null;
  return { zip: row.zip, email: row.email, code: CSV[String(row.status).trim().toLowerCase()] || "unknown", tracking: row.tracking || "" };
}

export async function lookup(cfg, { orderNo, check, lang }, env = process.env, fetchImpl = globalThis.fetch) {
  const L = STATUS_TEXT[lang || cfg.lang] ? (lang || cfg.lang) : "en";
  const text = (code) => cfg.statusText?.[L]?.[code] || STATUS_TEXT[L][code];
  const no = cleanNo(orderNo);
  const notFound = { found: false, text: text("notfound") };
  if (!no || !norm(check)) return notFound;
  const src = cfg.source;
  const o = src === "shopify" ? await fromShopify(cfg, env, fetchImpl, no)
    : src === "woocommerce" ? await fromWoo(cfg, env, fetchImpl, no)
    : src === "csv" ? fromCsv(cfg, no)
    : (() => { throw new Error(`unknown source ${src}`); })();
  if (!o) return notFound;
  const want = cfg.verify === "email" ? o.email : o.zip;
  if (!want || norm(want) !== norm(check)) return notFound;
  const tracking = /^https:\/\//.test(o.tracking) ? o.tracking : "";
  return { found: true, status: o.code, text: text(o.code) + (tracking ? ` ${tracking}` : ""), tracking };
}
