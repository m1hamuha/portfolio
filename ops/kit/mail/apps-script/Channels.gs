/**
 * Sending. Secrets are read from Script Properties only (Project settings > Script properties):
 *   WA_TOKEN        WhatsApp Cloud API token (Meta system user token) or 360dialog API key
 *   SMS_API_KEY     seven.io API key            (sms.provider = "seven")
 *   TWILIO_SID, TWILIO_TOKEN                     (sms.provider = "twilio")
 *   TG_BOT_TOKEN    optional, owner alerts in Telegram
 *   LINK_SECRET     random string for signed links (setup() creates it)
 */
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ""; }

function sendMessage_(msg, cfg) {
  try {
    if (msg.channel === "email") return sendEmail_(msg, cfg);
    if (msg.channel === "sms") return sendSms_(msg, cfg);
    if (msg.channel === "whatsapp") return sendWhatsApp_(msg, cfg);
    return { ok: false, error: "unknown channel " + msg.channel };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}

function sendEmail_(msg, cfg) {
  if (MailApp.getRemainingDailyQuota() < 1) return { ok: false, error: "daily e-mail quota used up, will retry next run" };
  var opts = { name: cfg.business.senderName || cfg.business.name };
  if (cfg.business.replyTo) opts.replyTo = cfg.business.replyTo;
  MailApp.sendEmail(msg.to, msg.subject, msg.text, opts);
  return { ok: true };
}

/* request for the WhatsApp Cloud API (Meta direct) or 360dialog (same body, other host and header) */
function waRequest_(msg, cfg) {
  var w = cfg.whatsapp, t = msg.template;
  var body = {
    messaging_product: "whatsapp", recipient_type: "individual", to: msg.to, type: "template",
    template: { name: t.name, language: { code: t.lang } }
  };
  if (t.params && t.params.length) body.template.components = [{ type: "body", parameters: t.params.map(function (p) { return { type: "text", text: p }; }) }];
  if (w.provider === "360dialog") return { url: "https://waba-v2.360dialog.io/messages", headers: { "D360-API-KEY": prop_("WA_TOKEN") }, body: body };
  return { url: "https://graph.facebook.com/" + w.graphVersion + "/" + w.phoneNumberId + "/messages", headers: { Authorization: "Bearer " + prop_("WA_TOKEN") }, body: body };
}
function sendWhatsApp_(msg, cfg) {
  if (!msg.template) return { ok: false, error: "no approved template configured for " + msg.kind };
  var rq = waRequest_(msg, cfg);
  var resp = UrlFetchApp.fetch(rq.url, { method: "post", contentType: "application/json", headers: rq.headers, payload: JSON.stringify(rq.body), muteHttpExceptions: true });
  var code = resp.getResponseCode(), j = {};
  try { j = JSON.parse(resp.getContentText()); } catch (e) { j = {}; }
  if (code >= 200 && code < 300 && j.messages && j.messages[0]) return { ok: true, id: j.messages[0].id };
  return { ok: false, error: "whatsapp " + code + " " + ((j.error && (j.error.message || j.error.title)) || "") };
}

function sendSms_(msg, cfg) {
  var s = cfg.sms, resp;
  if (s.provider === "twilio") {
    var sid = prop_("TWILIO_SID");
    resp = UrlFetchApp.fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
      method: "post", muteHttpExceptions: true,
      headers: { Authorization: "Basic " + Utilities.base64Encode(sid + ":" + prop_("TWILIO_TOKEN")) },
      payload: { To: "+" + msg.to, From: s.from, Body: msg.text }
    });
    var tj = {}; try { tj = JSON.parse(resp.getContentText()); } catch (e) { tj = {}; }
    return resp.getResponseCode() < 300 ? { ok: true, id: tj.sid || "" } : { ok: false, error: "twilio " + resp.getResponseCode() + " " + (tj.message || "") };
  }
  // seven.io (German provider). Docs: https://docs.seven.io/en/rest-api/endpoints/sms
  resp = UrlFetchApp.fetch("https://gateway.seven.io/api/sms", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { "X-Api-Key": prop_("SMS_API_KEY"), Accept: "application/json" },
    payload: JSON.stringify({ to: "+" + msg.to, text: msg.text, from: s.from || undefined })
  });
  var j = {}; try { j = JSON.parse(resp.getContentText()); } catch (e) { j = {}; }
  if (resp.getResponseCode() < 300 && String(j.success) === "100") return { ok: true, id: (j.messages && j.messages[0] && j.messages[0].id) || "" };
  return { ok: false, error: "seven " + resp.getResponseCode() + " " + (j.success || "") };
}

/* to the owner: e-mail always, Telegram as well if configured */
function notifyOwner_(subject, text, cfg) {
  var ok = false;
  try { MailApp.sendEmail(cfg.business.ownerEmail, subject, text, { name: "Reminders" }); ok = true; } catch (e) { ok = false; }
  var tg = prop_("TG_BOT_TOKEN"), chat = cfg.business.telegramChatId;
  // health: true (clinics): patient names, numbers and visit times stay in Google, never in Telegram (no data processing agreement)
  if (tg && chat && !cfg.health) {
    try {
      var r = UrlFetchApp.fetch("https://api.telegram.org/bot" + tg + "/sendMessage", {
        method: "post", contentType: "application/json", muteHttpExceptions: true,
        payload: JSON.stringify({ chat_id: chat, text: (subject + "\n\n" + text).slice(0, 4000), disable_web_page_preview: true })
      });
      ok = ok || r.getResponseCode() === 200;
    } catch (e) { /* e-mail is the fallback */ }
  }
  return { ok: ok };
}
