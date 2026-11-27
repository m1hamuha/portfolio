import test from "node:test";
import assert from "node:assert/strict";
import { findDuplicates, normPhone, normEmail, normName } from "../lib/dedupe.mjs";

test("normalisers", () => {
  assert.equal(normPhone("030 / 123 45 67"), "49301234567");
  assert.equal(normPhone("+49 (30) 1234567"), "49301234567");
  assert.equal(normPhone("0049 30 1234567"), "49301234567");
  assert.equal(normEmail(" Max.Muster+shop@GoogleMail.com"), "maxmuster@gmail.com");
  assert.equal(normName("Müller Bau GmbH & Co. KG"), "mueller bau");
});

test("groups by email, phone, name+zip, transitively", () => {
  const rows = [
    { name: "Müller Bau GmbH", email: "info@mueller-bau.example", phone: "", zip: "10115" },
    { name: "Mueller Bau", email: "", phone: "030 1234567", zip: "10115" },
    { name: "M. Bau", email: "", phone: "+49 30 1234567", zip: "" },
    { name: "Schmidt Reinigung", email: "kontakt@schmidt.example", phone: "", zip: "20095" },
    { name: "Schmidt Reinigung", email: "", phone: "", zip: "80331" },
  ];
  assert.deepEqual(findDuplicates(rows), [[0, 1, 2]]);
});
