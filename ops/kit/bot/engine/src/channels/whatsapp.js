/* WhatsApp Cloud API: webhook check, signature check, parsing, sending.
   Works with a number registered directly on the Cloud API and with a "coexistence" number
   (the same number stays in the WhatsApp Business app on the owner's phone).
   Secrets (wrangler secret put): WA_TOKEN, WA_APP_SECRET, WA_VERIFY_TOKEN. */

export function graphBase(env) { return `https://graph.facebook.com/${env.WA_GRAPH_VERSION || "v23.0"}`; }

/* GET /wa?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... */
export function verifyHandshake(url, env) {
  const p = url.searchParams;
  if (p.get("hub.mode") === "subscribe" && env.WA_VERIFY_TOKEN && p.get("hub.verify_token") === env.WA_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") || "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

/* X-Hub-Signature-256: sha256=<hex hmac of the raw body with the app secret> */
export async function signatureOk(raw, header, secret) {
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const got = header.slice(7);
  if (got.length !== hex.length) return false;
  let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ got.charCodeAt(i);
  return d === 0;
}

/* -> { incoming: [{ phoneNumberId, user, name, id, type, text }], echoes: [{ phoneNumberId, user }] }
   echoes = messages the owner typed in the Business app (coexistence). The engine then stays quiet in that chat. */
export function parseWebhook(body) {
  const incoming = []; const echoes = [];
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      const pid = v.metadata && v.metadata.phone_number_id;
      if (ch.field === "messages") {
        const names = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile && c.profile.name]));
        for (const m of v.messages || []) {
          const text = m.type === "text" ? m.text.body
            : m.type === "interactive" ? (m.interactive.button_reply || m.interactive.list_reply || {}).title
            : m.type === "button" ? m.button.text : null;
          incoming.push({ phoneNumberId: pid, user: m.from, name: names[m.from] || "", id: m.id, type: text != null ? "text" : m.type, text });
        }
      }
      if (ch.field === "smb_message_echoes") {
        for (const m of v.message_echoes || []) echoes.push({ phoneNumberId: pid, user: m.to });
      }
    }
  }
  return { incoming, echoes };
}

export async function sendText(env, phoneNumberId, to, body, fetchImpl = fetch) {
  const res = await fetchImpl(`${graphBase(env)}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: true, body: body.slice(0, 4096) } }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* utility template, needed when the 24 hour window with the recipient is closed (paid per message) */
export async function sendTemplate(env, phoneNumberId, to, name, lang, params, fetchImpl = fetch) {
  const res = await fetchImpl(`${graphBase(env)}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "template",
      template: { name, language: { code: lang }, components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p).slice(0, 1000) })) }] },
    }),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}
