/* E-invoices (XRechnung or ZUGFeRD/Factur-X XML, UBL or CII syntax): read and check the totals.
   read(xml) -> { format, fields, lines, taxes, totals }
   check(inv, { seen }) -> list of problems (empty = totals add up and the key fields are there).
   summary(inv, problems, lang) -> short readable text for the bookkeeping list.
   What this is: arithmetic and completeness, plus duplicates by seller and invoice number.
   What this is not: a tax check (correct VAT rate, right to deduct input tax). That stays with the bookkeeper.
   The original XML is stored unchanged by the caller (GoBD); this module never edits it.
   For the official schema and rule check, run the free KoSIT validator on the same file (see README). */

export function parseXml(xml) {
  const root = { name: "#root", children: [], text: "" };
  const stack = [root];
  const src = String(xml).replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/g, "");
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1] != null) { top.text += m[1]; continue; }
    if (m[6] != null) { top.text += m[6].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"); continue; }
    const local = m[3].replace(/^.*:/, "");
    if (m[2]) { if (stack.length > 1) stack.pop(); continue; }
    const attrs = {};
    for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].replace(/^.*:/, "")] = a[2] ?? a[3];
    const node = { name: local, attrs, children: [], text: "" };
    top.children.push(node);
    if (!m[5]) stack.push(node);
  }
  return root.children[0] || null;
}

const kids = (n, name) => (n ? n.children.filter((c) => c.name === name) : []);
const at = (n, path) => path.split("/").reduce((x, p) => (x ? kids(x, p)[0] : null), n);
const txt = (n, path) => { const x = path ? at(n, path) : n; return x ? x.text.trim() : ""; };
const cents = (s) => (s === "" || s == null ? null : Math.round(Number(String(s).trim()) * 100));

function readUbl(r) {
  const cur = txt(r, "DocumentCurrencyCode");
  const tm = at(r, "LegalMonetaryTotal");
  const taxTotal = kids(r, "TaxTotal").find((t) => !at(t, "TaxAmount")?.attrs.currencyID || at(t, "TaxAmount").attrs.currencyID === cur) || kids(r, "TaxTotal")[0];
  return {
    format: "UBL",
    fields: {
      number: txt(r, "ID"), date: txt(r, "IssueDate"), due: txt(r, "DueDate") || txt(r, "PaymentMeans/PaymentDueDate"), currency: cur,
      seller: txt(r, "AccountingSupplierParty/Party/PartyLegalEntity/RegistrationName") || txt(r, "AccountingSupplierParty/Party/PartyName/Name"),
      buyer: txt(r, "AccountingCustomerParty/Party/PartyLegalEntity/RegistrationName") || txt(r, "AccountingCustomerParty/Party/PartyName/Name"),
      buyerReference: txt(r, "BuyerReference"),
    },
    lines: kids(r, "InvoiceLine").concat(kids(r, "CreditNoteLine")).map((l) => ({ id: txt(l, "ID"), name: txt(l, "Item/Name"), net: cents(txt(l, "LineExtensionAmount")) })),
    taxes: kids(taxTotal, "TaxSubtotal").map((s) => ({ basis: cents(txt(s, "TaxableAmount")), tax: cents(txt(s, "TaxAmount")), rate: Number(txt(s, "TaxCategory/Percent") || 0), cat: txt(s, "TaxCategory/ID") })),
    totals: {
      lines: cents(txt(tm, "LineExtensionAmount")), allowances: cents(txt(tm, "AllowanceTotalAmount")) || 0, charges: cents(txt(tm, "ChargeTotalAmount")) || 0,
      net: cents(txt(tm, "TaxExclusiveAmount")), tax: cents(txt(taxTotal, "TaxAmount")), gross: cents(txt(tm, "TaxInclusiveAmount")),
      prepaid: cents(txt(tm, "PrepaidAmount")) || 0, rounding: cents(txt(tm, "PayableRoundingAmount")) || 0, payable: cents(txt(tm, "PayableAmount")),
    },
  };
}

function readCii(r) {
  const tx = at(r, "SupplyChainTradeTransaction");
  const ag = at(tx, "ApplicableHeaderTradeAgreement"), st = at(tx, "ApplicableHeaderTradeSettlement");
  const sum = at(st, "SpecifiedTradeSettlementHeaderMonetarySummation");
  const cur = txt(st, "InvoiceCurrencyCode");
  const taxNode = kids(sum, "TaxTotalAmount").find((t) => !t.attrs.currencyID || t.attrs.currencyID === cur);
  return {
    format: "CII",
    fields: {
      number: txt(r, "ExchangedDocument/ID"), date: txt(r, "ExchangedDocument/IssueDateTime/DateTimeString"),
      due: txt(st, "SpecifiedTradePaymentTerms/DueDateDateTime/DateTimeString"), currency: cur,
      seller: txt(ag, "SellerTradeParty/Name"), buyer: txt(ag, "BuyerTradeParty/Name"), buyerReference: txt(ag, "BuyerReference"),
    },
    lines: kids(tx, "IncludedSupplyChainTradeLineItem").map((l) => ({
      id: txt(l, "AssociatedDocumentLineDocument/LineID"), name: txt(l, "SpecifiedTradeProduct/Name"),
      net: cents(txt(l, "SpecifiedLineTradeSettlement/SpecifiedTradeSettlementLineMonetarySummation/LineTotalAmount")),
    })),
    taxes: kids(st, "ApplicableTradeTax").map((t) => ({ basis: cents(txt(t, "BasisAmount")), tax: cents(txt(t, "CalculatedAmount")), rate: Number(txt(t, "RateApplicablePercent") || 0), cat: txt(t, "CategoryCode") })),
    totals: {
      lines: cents(txt(sum, "LineTotalAmount")), allowances: cents(txt(sum, "AllowanceTotalAmount")) || 0, charges: cents(txt(sum, "ChargeTotalAmount")) || 0,
      net: cents(txt(sum, "TaxBasisTotalAmount")), tax: taxNode ? cents(taxNode.text) : null, gross: cents(txt(sum, "GrandTotalAmount")),
      prepaid: cents(txt(sum, "TotalPrepaidAmount")) || 0, rounding: cents(txt(sum, "RoundingAmount")) || 0, payable: cents(txt(sum, "DuePayableAmount")),
    },
  };
}

export function read(xml) {
  const r = parseXml(xml);
  if (!r) throw new Error("not XML");
  if (r.name === "Invoice" || r.name === "CreditNote") return readUbl(r);
  if (r.name === "CrossIndustryInvoice") return readCii(r);
  throw new Error(`not an e-invoice: <${r.name}>`);
}

/* Problem codes: missing:<field>, lines_sum, net, tax_group:<rate>, tax_sum, gross, payable, duplicate */
export function check(inv, { seen = [] } = {}) {
  const p = [];
  const f = inv.fields, t = inv.totals;
  for (const k of ["number", "date", "currency", "seller", "buyer"]) if (!f[k]) p.push(`missing:${k}`);
  for (const k of ["lines", "net", "gross", "payable"]) if (t[k] == null) p.push(`missing:${k}`);
  const near = (a, b) => a != null && b != null && Math.abs(a - b) <= 1;
  if (inv.lines.length && t.lines != null && !near(inv.lines.reduce((s, l) => s + (l.net || 0), 0), t.lines)) p.push("lines_sum");
  if (t.lines != null && t.net != null && !near(t.lines - t.allowances + t.charges, t.net)) p.push("net");
  for (const g of inv.taxes) if (g.basis != null && g.tax != null && !near(Math.round((g.basis * g.rate) / 100), g.tax)) p.push(`tax_group:${g.rate}`);
  const taxSum = inv.taxes.reduce((s, g) => s + (g.tax || 0), 0);
  if (t.tax != null && inv.taxes.length && !near(taxSum, t.tax)) p.push("tax_sum");
  if (t.net != null && t.gross != null && !near(t.net + (t.tax ?? taxSum), t.gross)) p.push("gross");
  if (t.gross != null && t.payable != null && !near(t.gross - t.prepaid + t.rounding, t.payable)) p.push("payable");
  const key = `${(f.seller || "").toLowerCase()}|${f.number}`;
  if (seen.some((s) => `${(s.seller || "").toLowerCase()}|${s.number}` === key)) p.push("duplicate");
  return p;
}

const L = {
  en: { ok: "Totals add up", bad: "Check", from: "from", due: "due", payable: "to pay" },
  de: { ok: "Summen stimmen", bad: "Prüfen", from: "von", due: "fällig", payable: "zu zahlen" },
  uk: { ok: "Суми сходяться", bad: "Перевірити", from: "від", due: "сплатити до", payable: "до сплати" },
  ru: { ok: "Суммы сходятся", bad: "Проверить", from: "от", due: "оплатить до", payable: "к оплате" },
};

export function summary(inv, problems, lang = "de") {
  const l = L[lang] || L.en, f = inv.fields;
  const money = (c) => (c == null ? "?" : (c / 100).toFixed(2));
  const head = `${f.number} ${l.from} ${f.seller}, ${f.date}${f.due ? `, ${l.due} ${f.due}` : ""}: ${money(inv.totals.payable)} ${f.currency} ${l.payable}`;
  return `${head}. ${problems.length ? `${l.bad}: ${problems.join(", ")}` : l.ok}.`;
}
