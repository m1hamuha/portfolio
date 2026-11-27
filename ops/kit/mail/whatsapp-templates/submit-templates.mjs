// Submits WhatsApp message templates for one client to Meta.
// Usage: WA_TOKEN=... WABA_ID=... node submit-templates.mjs "Business name" reminder_day_before,comeback_invite [de,ru]
// The token is read from the environment only. Nothing is stored.
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const LANG = { ru: "ru", uk: "uk", de: "de", en: "en" };

export function buildRequests(all, business, names, langs) {
  const out = [];
  for (const name of names) {
    const t = all[name];
    if (!t) throw new Error("unknown template " + name);
    for (const l of langs) {
      if (!t.body[l]) continue;
      const text = t.body[l].replaceAll("{{BUSINESS}}", business);
      const components = [{ type: "BODY", text, example: { body_text: [t.example] } }];
      if (t.buttons && t.buttons[l]) components.push({ type: "BUTTONS", buttons: t.buttons[l].map(b => ({ type: "QUICK_REPLY", text: b })) });
      out.push({ name, language: LANG[l], category: t.category, components });
    }
  }
  return out;
}

export async function submit(reqs, { token, wabaId, version = "v24.0", fetchImpl = fetch }) {
  const res = [];
  for (const body of reqs) {
    const r = await fetchImpl(`https://graph.facebook.com/${version}/${wabaId}/message_templates`, {
      method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    res.push({ name: body.name, language: body.language, ok: r.ok, status: j.status || (j.error && j.error.message) || r.status });
  }
  return res;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [business, names, langs = "de,ru,uk,en"] = process.argv.slice(2);
  if (!business || !names || !process.env.WA_TOKEN || !process.env.WABA_ID) {
    console.error('usage: WA_TOKEN=... WABA_ID=... node submit-templates.mjs "Business" name1,name2 [de,ru]');
    process.exit(1);
  }
  const all = JSON.parse(fs.readFileSync(new URL("./templates.json", import.meta.url), "utf8"));
  const reqs = buildRequests(all, business, names.split(","), langs.split(","));
  console.table(await submit(reqs, { token: process.env.WA_TOKEN, wabaId: process.env.WABA_ID }));
}
