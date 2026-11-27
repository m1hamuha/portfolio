/* How the owner hears about bookings and questions the bot cannot answer.
   business.json -> notify: "whatsapp" | "telegram" | "none"
   - whatsapp: message from the business number to the owner's private number (env OWNER_WA).
     Free text works only within 24 h after the owner last wrote to the business number; otherwise
     the engine falls back to an approved utility template (env WA_OWNER_TEMPLATE), which Meta bills.
   - telegram: a private bot posts into the owner's chat (env TG_TOKEN, TG_CHAT_ID). Free.
     Telegram has no data processing agreement: never for clinics, keep texts short.
   - none: the owner reads everything in the WhatsApp Business app (coexistence) or the calendar. */
import { sendText, sendTemplate } from "./channels/whatsapp.js";

export function makeNotifier(biz, env, fetchImpl = fetch) {
  const kind = biz.notify || "none";
  if (kind === "telegram") {
    return async (text) => {
      if (!env.TG_TOKEN || !env.TG_CHAT_ID) return;
      await fetchImpl(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: true }),
      });
    };
  }
  if (kind === "whatsapp") {
    return async (text) => {
      const pid = biz.whatsapp_phone_number_id;
      if (!env.OWNER_WA || !pid) return;
      const r = await sendText(env, pid, env.OWNER_WA, text, fetchImpl);
      const code = r.data && r.data.error && r.data.error.code;
      if (!r.ok && code === 131047 && env.WA_OWNER_TEMPLATE) {
        await sendTemplate(env, pid, env.OWNER_WA, env.WA_OWNER_TEMPLATE, biz.owner_lang || "de", [text.slice(0, 900)], fetchImpl);
      }
    };
  }
  return async () => {};
}
