import test from "node:test";
import assert from "node:assert/strict";
import { read, check, summary, parseXml } from "../lib/einvoice.mjs";

const UBL = `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ID>RE-2026-0815</cbc:ID>
  <cbc:IssueDate>2026-11-03</cbc:IssueDate>
  <cbc:DueDate>2026-11-17</cbc:DueDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>04011000-12345-67</cbc:BuyerReference>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>Muster &amp; Sohn GmbH</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>Beispiel Hausverwaltung</cbc:Name></cac:PartyName></cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="EUR">26.60</cbc:TaxAmount>
    <cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">120.00</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">22.80</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent></cac:TaxCategory></cac:TaxSubtotal>
    <cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">54.30</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">3.80</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>7</cbc:Percent></cac:TaxCategory></cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">174.30</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">174.30</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">200.90</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">200.90</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:LineExtensionAmount currencyID="EUR">120.00</cbc:LineExtensionAmount><cac:Item><cbc:Name>Wartung</cbc:Name></cac:Item></cac:InvoiceLine>
  <cac:InvoiceLine><cbc:ID>2</cbc:ID><cbc:LineExtensionAmount currencyID="EUR">54.30</cbc:LineExtensionAmount><cac:Item><cbc:Name>Material</cbc:Name></cac:Item></cac:InvoiceLine>
</ubl:Invoice>`;

const CII = `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
 <rsm:ExchangedDocument><ram:ID>4711</ram:ID><ram:IssueDateTime><udt:DateTimeString format="102">20261103</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
 <rsm:SupplyChainTradeTransaction>
  <ram:IncludedSupplyChainTradeLineItem><ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument><ram:SpecifiedTradeProduct><ram:Name>Reinigung</ram:Name></ram:SpecifiedTradeProduct><ram:SpecifiedLineTradeSettlement><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>100.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement></ram:IncludedSupplyChainTradeLineItem>
  <ram:ApplicableHeaderTradeAgreement><ram:SellerTradeParty><ram:Name>Glanz GmbH</ram:Name></ram:SellerTradeParty><ram:BuyerTradeParty><ram:Name>Büro Beispiel</ram:Name></ram:BuyerTradeParty></ram:ApplicableHeaderTradeAgreement>
  <ram:ApplicableHeaderTradeSettlement>
   <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
   <ram:ApplicableTradeTax><ram:CalculatedAmount>19.00</ram:CalculatedAmount><ram:BasisAmount>100.00</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>19</ram:RateApplicablePercent></ram:ApplicableTradeTax>
   <ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">20261117</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>
   <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    <ram:LineTotalAmount>100.00</ram:LineTotalAmount><ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
    <ram:TaxTotalAmount currencyID="EUR">19.00</ram:TaxTotalAmount><ram:GrandTotalAmount>119.00</ram:GrandTotalAmount>
    <ram:DuePayableAmount>119.00</ram:DuePayableAmount>
   </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
  </ram:ApplicableHeaderTradeSettlement>
 </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

test("XML parser: namespaces, entities, attributes", () => {
  const r = parseXml('<a:x xmlns:a="u"><a:y n="1">A &amp; B</a:y><z/></a:x>');
  assert.equal(r.name, "x");
  assert.equal(r.children[0].text, "A & B");
  assert.equal(r.children[0].attrs.n, "1");
  assert.equal(r.children[1].name, "z");
});

test("UBL XRechnung: fields read, totals add up", () => {
  const inv = read(UBL);
  assert.equal(inv.format, "UBL");
  assert.deepEqual(inv.fields, { number: "RE-2026-0815", date: "2026-11-03", due: "2026-11-17", currency: "EUR", seller: "Muster & Sohn GmbH", buyer: "Beispiel Hausverwaltung", buyerReference: "04011000-12345-67" });
  assert.equal(inv.lines.length, 2);
  assert.deepEqual(check(inv), []);
  assert.equal(summary(inv, [], "de"), "RE-2026-0815 von Muster & Sohn GmbH, 2026-11-03, fällig 2026-11-17: 200.90 EUR zu zahlen. Summen stimmen.");
});

test("UBL: wrong total, wrong VAT group and duplicate are found", () => {
  const bad = UBL.replace("<cbc:TaxInclusiveAmount currencyID=\"EUR\">200.90", "<cbc:TaxInclusiveAmount currencyID=\"EUR\">209.90").replace(">3.80<", ">4.80<");
  const inv = read(bad);
  const p = check(inv, { seen: [{ seller: "muster & sohn gmbh", number: "RE-2026-0815" }] });
  assert.ok(p.includes("tax_group:7"), p.join());
  assert.ok(p.includes("tax_sum"));
  assert.ok(p.includes("gross"));
  assert.ok(p.includes("payable"));
  assert.ok(p.includes("duplicate"));
  assert.match(summary(inv, p, "ru"), /Проверить: /);
});

test("CII (ZUGFeRD/Factur-X): read and check, missing buyer flagged", () => {
  const inv = read(CII);
  assert.equal(inv.format, "CII");
  assert.equal(inv.fields.number, "4711");
  assert.equal(inv.fields.due, "20261117");
  assert.equal(inv.totals.payable, 11900);
  assert.deepEqual(check(inv), []);
  const noBuyer = read(CII.replace("<ram:Name>Büro Beispiel</ram:Name>", ""));
  assert.deepEqual(check(noBuyer), ["missing:buyer"]);
  const lineOff = read(CII.replace("<ram:LineTotalAmount>100.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>", "<ram:LineTotalAmount>90.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>"));
  assert.deepEqual(check(lineOff), ["lines_sum"]);
});

test("not an e-invoice throws", () => {
  assert.throws(() => read("<html><body/></html>"), /not an e-invoice/);
});
