/* Orders from e-mails into your list. The model turns the e-mail text into JSON lines; code then checks every
   line against the firm's article list, so no invented article or price gets into the sheet.
   extract(llm, mailText, catalog) -> { rows, doubtful }
   catalog: [{ sku, name, unit, price }]. Rows land in the order sheet; doubtful lines are marked for a person.
   Import into an ERP is a separate job and only where the ERP has a CSV import or API (see README). */

import { redact } from "./llm.mjs";

const SYSTEM = `You read one customer order e-mail. Return only JSON: {"customer":"","orderRef":"","delivery":"","lines":[{"sku":"","name":"","qty":0}]}.
Use only articles the e-mail names. Do not guess prices. If a quantity or article is unclear, keep the words in "name" and set "sku" to "".`;

export function toRows(parsed, catalog) {
  const bySku = new Map(catalog.map((c) => [String(c.sku).toLowerCase(), c]));
  const rows = [], doubtful = [];
  for (const l of parsed.lines || []) {
    const c = bySku.get(String(l.sku || "").toLowerCase());
    const qty = Number(l.qty);
    const ok = c && Number.isFinite(qty) && qty > 0;
    const row = { customer: parsed.customer || "", orderRef: parsed.orderRef || "", delivery: parsed.delivery || "",
      sku: c ? c.sku : l.sku || "", name: c ? c.name : l.name || "", qty: Number.isFinite(qty) ? qty : "", unit: c?.unit || "",
      price: c ? c.price : "", check: ok ? "" : "CHECK" };
    rows.push(row);
    if (!ok) doubtful.push(row);
  }
  return { rows, doubtful };
}

export async function extract(llm, mailText, catalog) {
  const raw = await llm.complete({ system: SYSTEM, user: redact(mailText), maxTokens: 1500 });
  let parsed;
  try { parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); }
  catch { return { rows: [], doubtful: [{ check: "CHECK", name: "could not read this e-mail" }] }; }
  return toRows(parsed, catalog);
}
