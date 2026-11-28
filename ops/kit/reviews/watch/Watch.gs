/* reviews kit: watcher. Runs in Google Apps Script on Mikhail's work Google account (one script for all clients).
   Needs Core.gs from ../lib in the same project.

   What it does every run (trigger: every 2 hours, see setupWatch):
   0. Trigger interval: Script Property WATCH_EVERY_HOURS (1, 2, 4, 6, 8 or 12; default 6). Places API bills every call:
      1 000 free calls a month for the reviews SKU, shared by ALL clients. 6 hours = 120 calls a month per client.
   1. For each client in CLIENTS_JSON reads the reviews:
      - source "gbp": Business Profile API (all reviews, needs approved API access + manager rights on the profile);
      - source "places": Places API (New), rating + count + at most 5 reviews (no access approval needed, only an API key).
   2. New review -> reply draft from the LLM (rules in Core.gs buildReplyPrompt) -> checked by checkReply.
   3. One mail to the operator per run with all drafts. Stars <= alert_max_stars: also a Telegram message at once,
      and (notify_owner) a mail to the owner. Every draft carries a wa.me link that opens WhatsApp to the owner with the draft.
      Places shows more ratings than it returns: the owner (owner_drafts or notify_owner) gets a heads-up with the Maps
      link, so a new review is never missed silently. Turn off per client with "owner_heads_up": false.
   4. Source "gbp" only: an approve link. Click it after the owner said yes, and the reply is posted on Google.

   Script Properties (Project settings > Script properties). Secrets ONLY here, never in the code or the repo:
     CLIENTS_JSON      JSON array of business configs (see ../examples/*.json)
     OPERATOR_EMAIL    where drafts go (Mikhail's work mail)
     PLACES_API_KEY    Google Maps Platform key, restricted to Places API (New)   [source "places"]
     ANTHROPIC_API_KEY key for drafts; without it the watcher only alerts
     LLM_PROVIDER      "anthropic" (default) | "none"
     LLM_MODEL         default claude-haiku-5-5
     TG_BOT_TOKEN, TG_CHAT_ID   optional, instant alert for bad reviews
     APPROVE_SECRET    long random string, signs approve links            [source "gbp"]
     WEBAPP_URL        URL of this script deployed as a web app             [source "gbp"]
   State is kept in Script Properties under "state:<client id>" and "draft:<client id>:<review id>". */

var STAR_ENUM = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function props_() { return PropertiesService.getScriptProperties(); }
function prop_(k, d) { var v = props_().getProperty(k); return v == null || v === "" ? d : v; }

function clients_() {
  var raw = prop_("CLIENTS_JSON", "[]");
  var list = JSON.parse(raw);
  return Array.isArray(list) ? list : [list];
}

function setupWatch() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "watchAll") ScriptApp.deleteTrigger(t); });
  var h = Number(prop_("WATCH_EVERY_HOURS", "6"));
  if ([1, 2, 4, 6, 8, 12].indexOf(h) < 0) h = 6;
  ScriptApp.newTrigger("watchAll").timeBased().everyHours(h).create();
}

/* ---------- reading reviews ---------- */

function fetchJson_(url, opts) {
  opts = opts || {};
  opts.muteHttpExceptions = true;
  var res = UrlFetchApp.fetch(url, opts);
  var code = res.getResponseCode(), body = res.getContentText();
  if (code < 200 || code >= 300) throw new Error("HTTP " + code + " " + url.split("?")[0] + ": " + body.slice(0, 200));
  return body ? JSON.parse(body) : {};
}

/* Places API (New). Billing: Place Details Enterprise + Atmosphere (because of "reviews"). */
function fetchPlaces_(biz) {
  var key = prop_("PLACES_API_KEY");
  if (!key) throw new Error("PLACES_API_KEY is not set");
  var lang = biz.lang || "de";
  var data = fetchJson_("https://places.googleapis.com/v1/places/" + encodeURIComponent(biz.place_id) + "?languageCode=" + lang, {
    method: "get",
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews" }
  });
  var reviews = (data.reviews || []).map(function (r) {
    var t = r.originalText || r.text || {};
    return {
      id: String(r.name || "").split("/").pop() || (r.publishTime + ":" + ((r.authorAttribution || {}).displayName || "")),
      author: (r.authorAttribution || {}).displayName || "",
      rating: r.rating || 0,
      text: t.text || "",
      lang: t.languageCode || "",
      time: r.publishTime || "",
      replied: null
    };
  });
  return { rating: data.rating || 0, count: data.userRatingCount || 0, reviews: reviews, complete: false };
}

/* Business Profile API, legacy v4 reviews endpoint (the only one with reviews and replies). */
function gbpBase_(biz) {
  if (!biz.gbp || !biz.gbp.account || !biz.gbp.location) throw new Error("gbp.account and gbp.location are needed");
  return "https://mybusiness.googleapis.com/v4/" + biz.gbp.account + "/" + biz.gbp.location;
}

function fetchGbp_(biz) {
  var data = fetchJson_(gbpBase_(biz) + "/reviews?pageSize=50&orderBy=" + encodeURIComponent("updateTime desc"), {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  });
  var reviews = (data.reviews || []).map(function (r) {
    return {
      id: r.reviewId,
      author: (r.reviewer || {}).displayName || "",
      rating: STAR_ENUM[r.starRating] || 0,
      text: r.comment || "",
      lang: "",
      time: r.createTime || "",
      replied: !!(r.reviewReply && r.reviewReply.comment)
    };
  });
  return { rating: data.averageRating || 0, count: data.totalReviewCount || 0, reviews: reviews, complete: true };
}

function postGbpReply_(biz, reviewId, text) {
  return fetchJson_(gbpBase_(biz) + "/reviews/" + encodeURIComponent(reviewId) + "/reply", {
    method: "put",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ comment: text })
  });
}

/* ---------- LLM (swappable: add a provider here) ---------- */

var LLM_PROVIDERS = {
  anthropic: function (system, user, maxTokens) {
    var key = prop_("ANTHROPIC_API_KEY");
    if (!key) return null;
    var data = fetchJson_(prop_("ANTHROPIC_URL", "https://api.anthropic.com/v1/messages"), {
      method: "post",
      contentType: "application/json",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      payload: JSON.stringify({
        model: prop_("LLM_MODEL", "claude-haiku-5-5"),
        max_tokens: maxTokens || 2000,
        system: system,
        messages: [{ role: "user", content: user }],
        output_config: { effort: "low" }
      })
    });
    if (data.stop_reason === "refusal") return "";
    return (data.content || []).filter(function (b) { return b.type === "text"; }).map(function (b) { return b.text; }).join("");
  },
  none: function () { return null; }
};

function draftFor_(biz, review) {
  var fn = LLM_PROVIDERS[prop_("LLM_PROVIDER", "anthropic")];
  if (!fn) throw new Error("unknown LLM_PROVIDER");
  var p = buildReplyPrompt(biz, review);
  var raw;
  try { raw = fn(p.system, p.user, 2000); } catch (e) { return { reply: "", problems: ["LLM error: " + e.message], needs_owner_ok: true, flags: [] }; }
  if (raw == null) return { reply: "", problems: ["no LLM configured"], needs_owner_ok: true, flags: [] };
  var parsed = parseModelJson(raw) || { reply: "", flags: ["model output was not JSON"] };
  return checkReply(biz, review, parsed);
}

/* ---------- one client ---------- */

function loadState_(id) { var s = prop_("state:" + id); return s ? JSON.parse(s) : null; }
/* one Script Property value may hold at most 9 KB: keep the newest ids that fit in about 7 KB */
function capIds_(ids) {
  var out = [], len = 0;
  for (var i = 0; i < ids.length && out.length < 200; i++) {
    if (out.indexOf(ids[i]) >= 0) continue;
    len += String(ids[i]).length + 3;
    if (len > 7000) break;
    out.push(ids[i]);
  }
  return out;
}
function saveState_(id, st) { st.seen = capIds_(st.seen || []); props_().setProperty("state:" + id, JSON.stringify(st)); }

/* Returns { biz, items: [{review, draft, owner_link, approve_link}], ratingsOnly: {added, avg, sure} | null, error } */
function checkClient_(biz) {
  var snap = biz.source === "gbp" ? fetchGbp_(biz) : fetchPlaces_(biz);
  var st = loadState_(biz.id);
  var out = { biz: biz, items: [], ratingsOnly: null, snap: snap, first: !st };
  if (!st) {
    /* first run: remember what exists, do not draft for old reviews */
    saveState_(biz.id, { seen: snap.reviews.map(function (r) { return r.id; }), rating: snap.rating, count: snap.count });
    return out;
  }
  var seen = {};
  st.seen.forEach(function (id) { seen[id] = true; });
  var fresh = snap.reviews.filter(function (r) { return !seen[r.id] && !r.replied; });
  fresh.forEach(function (r) {
    var d = draftFor_(biz, r);
    var item = { review: r, draft: d, owner_link: null, approve_link: null };
    if (d.reply && biz.owner_whatsapp) {
      item.owner_link = waLink(biz.owner_whatsapp, (r.author || "") + " (" + (r.rating || "?") + "/5): " + String(r.text || "").slice(0, 300) + "\n\n" + "Draft reply:\n" + d.reply + "\n\nOK?", biz.country_code);
    }
    if (d.reply && biz.source === "gbp" && prop_("WEBAPP_URL") && prop_("APPROVE_SECRET")) {
      props_().setProperty("draft:" + biz.id + ":" + r.id, JSON.stringify({ t: Date.now(), text: d.reply }));
      item.approve_link = approveLink_(biz.id, r.id);
    }
    out.items.push(item);
  });
  /* ratings without text, or reviews outside the 5 that Places shows */
  var added = snap.count - (st.count || 0);
  if (!snap.complete && added > fresh.length) {
    var est = estimateNewStars({ rating: st.rating, count: st.count }, { rating: snap.rating, count: snap.count });
    out.ratingsOnly = { added: added - fresh.length, avg: est.avg, sure: est.sure };
  }
  var ids = snap.reviews.map(function (r) { return r.id; }).concat(st.seen);
  saveState_(biz.id, { seen: ids, rating: snap.rating, count: snap.count });
  return out;
}

/* ---------- approve links (HMAC) ---------- */

function sign_(s) {
  var bytes = Utilities.computeHmacSha256Signature(s, prop_("APPROVE_SECRET"));
  return bytes.map(function (b) { var h = (b < 0 ? b + 256 : b).toString(16); return h.length === 1 ? "0" + h : h; }).join("").slice(0, 32);
}

function approveLink_(clientId, reviewId) {
  var q = "c=" + encodeURIComponent(clientId) + "&r=" + encodeURIComponent(reviewId);
  return prop_("WEBAPP_URL") + "?a=post&" + q + "&s=" + sign_(clientId + "|" + reviewId);
}

function draftGet_(key) {
  var raw = prop_(key);
  if (!raw) return "";
  try { var o = JSON.parse(raw); return o && o.text ? o.text : ""; } catch (e) { return raw; }
}

/* drafts never approved are dropped after DRAFT_KEEP_DAYS (default 14), so Script Properties (500 KB in all) never fill up */
function pruneDrafts_() {
  var all = props_().getProperties ? props_().getProperties() : {};
  var limit = Date.now() - Number(prop_("DRAFT_KEEP_DAYS", "14")) * 864e5;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf("draft:") !== 0) return;
    var t = 0;
    try { t = JSON.parse(all[k]).t || 0; } catch (e) { t = 0; }
    if (t < limit) props_().deleteProperty(k);
  });
}

function page_(inner) {
  return HtmlService.createHtmlOutput("<meta name=viewport content='width=device-width'><div style='font:18px sans-serif;margin:16px'>" + inner + "</div>");
}

/* Web app: deploy as "Execute as: me", "Who has access: Anyone". Only a correctly signed link does anything.
   GET only shows the text and a button. Posting happens on POST (the button), because mail scanners,
   "safe links" and chat link previews open GET links on their own. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.a !== "post") return page_("OK");
  if (!p.c || !p.r || p.s !== sign_(p.c + "|" + p.r)) return page_("Link is not valid.");
  var text = draftGet_("draft:" + p.c + ":" + p.r);
  if (!text) return page_("Nothing to post (already posted or expired).");
  var url = prop_("WEBAPP_URL", "");
  return page_("<p>Post this reply on Google?</p><blockquote>" + escapeHtml(text) + "</blockquote>" +
    "<form method='post' action='" + escapeHtml(url) + "' target='_top'>" +
    "<input type='hidden' name='a' value='post'><input type='hidden' name='c' value='" + escapeHtml(p.c) + "'>" +
    "<input type='hidden' name='r' value='" + escapeHtml(p.r) + "'><input type='hidden' name='s' value='" + escapeHtml(p.s) + "'>" +
    "<button style='font:inherit;padding:12px 20px'>Yes, post it</button></form>");
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var html = function (msg) { return page_("<p>" + escapeHtml(msg) + "</p>"); };
  if (p.a !== "post" || !p.c || !p.r || p.s !== sign_(p.c + "|" + p.r)) return html("Link is not valid.");
  var key = "draft:" + p.c + ":" + p.r;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var text = draftGet_(key);
    if (!text) return html("Nothing to post (already posted or expired).");
    var biz = clients_().filter(function (b) { return b.id === p.c; })[0];
    if (!biz) return html("Unknown client.");
    try { postGbpReply_(biz, p.r, text); } catch (err) { return html("Google said no: " + err.message); }
    props_().deleteProperty(key);
    return html("Posted on Google: " + text);
  } finally { lock.releaseLock(); }
}

/* ---------- notifications ---------- */

function itemText_(it) {
  var r = it.review, d = it.draft, lines = [];
  lines.push((r.author || "?") + ", " + (r.rating || "?") + "/5" + (r.time ? ", " + r.time.slice(0, 10) : ""));
  lines.push(r.text ? "> " + r.text : "> (only stars, no text)");
  lines.push("Draft: " + (d.reply || "(none)"));
  if (d.problems && d.problems.length) lines.push("CHECK: " + d.problems.join("; "));
  if (it.owner_link) lines.push("Send to owner on WhatsApp: " + it.owner_link);
  if (it.approve_link) lines.push("After the owner's yes, post: " + it.approve_link);
  return lines.join("\n");
}

function reportText_(res) {
  var b = res.biz, parts = ["== " + b.name + " (" + res.snap.rating + " stars, " + res.snap.count + " ratings)"];
  if (res.first) parts.push("First run: " + res.snap.reviews.length + " existing reviews remembered, no drafts.");
  res.items.forEach(function (it) { parts.push(itemText_(it)); });
  if (res.ratingsOnly) {
    var ro = res.ratingsOnly;
    parts.push(ro.added + " new rating(s) not visible in the API" + (ro.avg ? ", average about " + ro.avg + (ro.sure ? "" : " (rough)") : "") + ". Check on Maps: " + mapsUrl(b));
  }
  if (res.error) parts.push("ERROR: " + res.error);
  return parts.join("\n\n");
}

/* text for the business owner: the review, the draft, where to paste it. No approve link (that one is for Mikhail). */
function ownerText_(biz, it) {
  var r = it.review, d = it.draft;
  return "New Google review / Neue Bewertung, " + (r.rating || "?") + "/5, " + (r.author || "") + ":\n" + (r.text || "(only stars)") +
    "\n\n" + (biz.owner_drafts && d.reply ? "Reply draft, check it and paste it under the review:\n" + d.reply + (d.problems && d.problems.length ? "\n(CHECK: " + d.problems.join("; ") + ")" : "") +
    "\n\nWhere: Google Maps app > You > Your business > Reviews, or " + mapsUrl(biz) :
      biz.owner_drafts ? "No draft this time. Please look on Google Maps and reply there: " + mapsUrl(biz) : "Mikhail will send you a reply draft on WhatsApp.");
}

/* heads-up for the owner when Places shows more ratings than it lets us read (it returns at most 5 reviews).
   The owner learns that something new came in and where to look, so a new bad review is not missed silently. */
function ownerHeadsUpText_(biz, ro) {
  return "New Google rating(s) / Neue Bewertung(en): " + ro.added +
    (ro.avg ? ", about " + ro.avg + " stars / ca. " + ro.avg + " Sterne" + (ro.sure ? "" : " (rough / grob)") : "") + ".\n" +
    "The text is not visible to the watcher yet. Please look on Google Maps and reply there if needed.\n" +
    "Der Text ist für den Wächter noch nicht sichtbar. Bitte in Google Maps nachsehen und dort antworten.\n" + mapsUrl(biz);
}

function wantsHeadsUp_(biz) { return biz.owner_heads_up !== false && !!(biz.owner_drafts || biz.notify_owner); }

function isBad_(biz, it) { return (it.review.rating || 5) <= (biz.alert_max_stars || 3); }

function telegram_(text, chatId) {
  var tok = prop_("TG_BOT_TOKEN"), chat = chatId || prop_("TG_CHAT_ID");
  if (!tok || !chat) return;
  var res = UrlFetchApp.fetch("https://api.telegram.org/bot" + tok + "/sendMessage", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: true })
  });
  if (res.getResponseCode() !== 200) throw new Error("Telegram HTTP " + res.getResponseCode());
}

function watchAll() {
  var results = [];
  clients_().forEach(function (biz) {
    var res;
    try { res = checkClient_(biz); } catch (e) { res = { biz: biz, items: [], snap: { rating: "?", count: "?", reviews: [] }, error: e.message }; }
    results.push(res);
    var safe = function (what, fn) { try { fn(); } catch (e) { res.error = (res.error ? res.error + "; " : "") + what + " failed: " + e.message; } };
    res.items.forEach(function (it) {
      var bad = isBad_(biz, it);
      if (bad) safe("Telegram", function () { telegram_("Bad review: " + biz.name + "\n\n" + itemText_(it)); });
      /* owner_drafts: the owner gets every draft himself and pastes it (no work for Mikhail after set-up).
         notify_owner: the owner only hears about bad reviews, Mikhail sends the draft. */
      if (!biz.owner_drafts && !(bad && biz.notify_owner)) return;
      var body = ownerText_(biz, it);
      if (biz.owner_email) safe("Owner mail", function () { MailApp.sendEmail(biz.owner_email, "Neue Google-Bewertung " + it.review.rating + "/5: " + biz.name, body); });
      if (biz.owner_telegram_chat_id) safe("Owner Telegram", function () { telegram_(body, biz.owner_telegram_chat_id); });
    });
    if (res.ratingsOnly && res.ratingsOnly.added > 0 && wantsHeadsUp_(biz)) {
      var hu = ownerHeadsUpText_(biz, res.ratingsOnly);
      if (biz.owner_email) safe("Owner heads-up mail", function () { MailApp.sendEmail(biz.owner_email, "Neue Google-Bewertung: " + biz.name, hu); });
      if (biz.owner_telegram_chat_id) safe("Owner heads-up Telegram", function () { telegram_(hu, biz.owner_telegram_chat_id); });
    }
  });
  try { pruneDrafts_(); } catch (e) { /* not important for this run */ }
  var worth = results.filter(function (r) { return r.items.length || r.ratingsOnly || r.error || r.first; });
  var op = prop_("OPERATOR_EMAIL");
  if (worth.length && op) {
    var n = worth.reduce(function (a, r) { return a + r.items.length; }, 0);
    MailApp.sendEmail(op, "Reviews: " + n + " new, " + worth.length + " client(s)", worth.map(reportText_).join("\n\n\n"));
  }
  return results;
}
