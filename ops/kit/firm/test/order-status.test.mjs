import test from "node:test";
import assert from "node:assert/strict";
import { lookup, parseCsv } from "../lib/order-status.mjs";

const res = (status, json) => ({ ok: status >= 200 && status < 300, status, json: async () => json, text: async () => JSON.stringify(json) });

test("shopify: read-only GraphQL, answers only with matching postcode", async () => {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, init });
    return res(200, { data: { orders: { nodes: [{ name: "#1001", email: "kunde@example.de", cancelledAt: null, displayFulfillmentStatus: "FULFILLED", shippingAddress: { zip: "10115" }, fulfillments: [{ trackingInfo: [{ url: "https://track.example/123" }] }] }] } } });
  };
  const cfg = { source: "shopify", shop: "demo", verify: "zip", lang: "de" };
  const ok = await lookup(cfg, { orderNo: "#1001", check: " 10115 " }, { SHOPIFY_TOKEN: "t" }, f);
  assert.equal(ok.found, true);
  assert.equal(ok.status, "shipped");
  assert.match(ok.text, /unterwegs.*https:\/\/track\.example\/123/);
  assert.equal(calls[0].url, "https://demo.myshopify.com/admin/api/2025-10/graphql.json");
  assert.equal(calls[0].init.headers["x-shopify-access-token"], "t");
  assert.deepEqual(JSON.parse(calls[0].init.body).variables, { q: "name:#1001" });
  const wrong = await lookup(cfg, { orderNo: "1001", check: "99999" }, { SHOPIFY_TOKEN: "t" }, f);
  assert.equal(wrong.found, false);
  assert.ok(!wrong.text.includes("track"));
});

test("woocommerce: basic auth, status map, e-mail check, 404 = not found", async () => {
  const f = async (url, init) => {
    if (url.endsWith("/77")) return res(404, {});
    assert.equal(url, "https://shop.example/wp-json/wc/v3/orders/42");
    assert.equal(init.headers.authorization, `Basic ${Buffer.from("ck:cs").toString("base64")}`);
    return res(200, { status: "processing", billing: { email: "A@Example.de", postcode: "20095" }, shipping: {} });
  };
  const cfg = { source: "woocommerce", baseUrl: "https://shop.example/", verify: "email" };
  const env = { WC_KEY: "ck", WC_SECRET: "cs" };
  const r = await lookup(cfg, { orderNo: "42", check: "a@example.de", lang: "ru" }, env, f);
  assert.deepEqual([r.found, r.status, r.text], [true, "processing", "Твой заказ готовим."]);
  assert.equal((await lookup(cfg, { orderNo: "77", check: "a@example.de" }, env, f)).found, false);
  assert.equal((await lookup(cfg, { orderNo: "abc", check: "a@example.de" }, env, f)).found, false);
});

test("csv export works without any API, unknown status goes to a person", async () => {
  const csvText = "Order;Zip;Email;Status;Tracking\nA-17;80331;x@example.de;versandt;https://track.example/9\nA-18;80331;;Rückfrage;";
  assert.equal(parseCsv(csvText).length, 2);
  const cfg = { source: "csv", csvText, verify: "zip", lang: "uk" };
  const r = await lookup(cfg, { orderNo: "A-17", check: "80331" });
  assert.equal(r.status, "shipped");
  assert.match(r.text, /в дорозі/);
  const u = await lookup(cfg, { orderNo: "A-18", check: "80331" });
  assert.equal(u.status, "unknown");
  assert.match(u.text, /Колега/);
});

test("missing secrets throw, empty check is not found", async () => {
  await assert.rejects(lookup({ source: "shopify", shop: "d" }, { orderNo: "1", check: "1" }, {}, async () => res(200, {})), /SHOPIFY_TOKEN/);
  assert.equal((await lookup({ source: "csv", csvText: "" }, { orderNo: "1", check: "" })).found, false);
});
