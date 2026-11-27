/* The conversation engine. Channel-independent: WhatsApp, the site chat and tests all call handle().
   The model only classifies and writes short answers from business.json. Code does the rest:
   real free times from the calendar, bookings, table capacity, hand-over to the owner. */
import { systemPrompt } from "./prompt.js";
import { parseJSON } from "./llm.js";
import { t, guessLang, LANGS } from "./i18n.js";
import { mentionsHealth, pricesOk, timesOk, clean } from "./guard.js";
import { computeSlots, zonedToDate, localParts, addDays, inPart, fmtSlot, weekdayOf } from "./time.js";

const HISTORY = 12;

export async function pauseChat(store, biz, user, hours) {
  const h = hours ?? biz.human_pause_hours ?? 12;
  if (h > 0) await store.put(`x:${biz.id}:${user}`, { since: Date.now() }, h * 3600);
}

/* msg: { channel: "whatsapp"|"web", user, name?, phone?, text?, type? }
   ctx: { biz, llm, calendar, store, notify(text), now } */
export async function handle(msg, ctx) {
  const { biz, store } = ctx;
  const now = ctx.now || new Date();
  const key = `${biz.id}:${msg.user}`;
  const res = { replies: [], notified: [], intent: null };
  const say = (s) => res.replies.push(s);
  const tell = async (s) => { res.notified.push(s); if (ctx.notify) await ctx.notify(s); };
  const contact = msg.channel === "whatsapp" ? `wa.me/${msg.user}` : msg.phone || msg.email || "site chat";

  if (await store.get(`x:${key}`)) return { ...res, intent: "paused" };

  const sess = await store.get(`s:${key}`);
  const first = !sess;
  /* "1" or "ok" says nothing about the language: keep the one of the conversation */
  let lang = msg.lang && LANGS.includes(msg.lang) ? msg.lang
    : sess && sess.lang && !/\p{L}{4,}/u.test(String(msg.text || "")) ? sess.lang : guessLang(msg.text, biz);
  const finish = async (intent, history) => {
    res.intent = intent;
    await store.put(`s:${key}`, { lang }, 30 * 86400);
    if (first && biz.ai_disclosure !== false && res.replies.length) res.replies[0] = `${t(biz, lang, "disclosure")}\n${res.replies[0]}`;
    if (history) {
      history.push({ role: "assistant", content: res.replies.join("\n") || "(no reply)" });
      await store.put(`h:${key}`, history.slice(-HISTORY), 86400);
    }
    return res;
  };

  if (msg.type && msg.type !== "text") { say(t(biz, lang, "nontext")); return finish("nontext"); }
  const text = String(msg.text || "").slice(0, 1500);

  /* clinics: health words never reach the model; the practice answers personally */
  if (biz.health_guard && mentionsHealth(text)) {
    say(t(biz, lang, "health"));
    await tell(`${biz.name}: new patient message, not answered by the bot. Please read it in WhatsApp (${contact}).`);
    return finish("health");
  }

  const history = (await store.get(`h:${key}`)) || [];
  let pending = await store.get(`p:${key}`);
  history.push({ role: "user", content: text });

  /* a bare number after an offer is a choice: no model call needed */
  let out;
  const num = pending && pending.slots && text.match(/^\s*(\d)\s*[.)]?\s*$/);
  if (num) out = { intent: "book", slot_index: +num[1], lang };
  else if (msg.action === "book") out = { intent: "book", slot_index: msg.slot_index, lang };
  else {
    try {
      const raw = await ctx.llm.complete({ system: systemPrompt(biz, { channel: msg.channel, now, pending, lang }), messages: alternate(history) });
      out = parseJSON(raw);
    } catch (e) { out = null; }
    if (!out) { say(t(biz, lang, "error")); await tell(`${biz.name}: the bot could not answer ${contact}: "${text.slice(0, 200)}"`); return finish("error", history); }
  }
  if (out.lang && LANGS.includes(out.lang) && (biz.languages || LANGS).includes(out.lang)) lang = out.lang;
  const reply = clean(out.reply, 600);
  const safe = reply && pricesOk(reply, biz) && timesOk(reply, biz);
  const mode = (biz.booking && biz.booking.mode) || "none";

  const handover = async (why) => {
    say(t(biz, lang, "handover", { owner_hours: (biz.owner_reply_hint || {})[lang] || "" }));
    await tell(`${biz.name}: please answer ${contact} (${why}): "${text.slice(0, 300)}"`);
    return finish("handover", history);
  };

  switch (out.intent) {
    case "slots": {
      if (mode === "link") { if (safe) say(reply); say(t(biz, lang, "link", { link: biz.booking.link })); return finish("link", history); }
      if (mode !== "calendar" && mode !== "classes") break;
      const svc = pickService(biz, out.service_id, mode);
      if (!svc) { say(t(biz, lang, "which_service", { list: bookable(biz, mode).map((s) => nameOf(s.name, lang)).join(", ") })); return finish("which_service", history); }
      const slots = await findSlots(ctx, svc, out.date, out.part_of_day, now, lang);
      if (!slots.length) {
        say(t(biz, lang, "no_slots"));
        await tell(`${biz.name}: no free time found for ${contact}, ${nameOf(svc.name, "en")}, wish: "${text.slice(0, 200)}"`);
        return finish("no_slots", history);
      }
      await store.put(`p:${key}`, { service_id: svc.id, slots }, 7200);
      if (safe && !/\?\s*$/.test(reply)) say(reply);
      say(t(biz, lang, "offer", { list: slots.map((s, i) => `${i + 1}) ${s.label}`).join("\n") }));
      return finish("slots", history);
    }

    case "book": {
      if (mode === "link") { say(t(biz, lang, "link", { link: biz.booking.link })); return finish("link", history); }
      const slot = pending && pending.slots && pending.slots[(out.slot_index || 0) - 1];
      if (!slot) break; /* nothing offered yet: treat as a normal answer below */
      const svc = pickService(biz, pending.service_id, mode) || { id: pending.service_id, name: pending.service_id };
      const guest = msg.name || out.guest_name || "";
      if (biz.booking.need_name && !guest) { say(t(biz, lang, "ask_name")); return finish("ask_name", history); }
      const start = new Date(slot.start); const end = new Date(slot.end);
      if (ctx.calendar && ctx.calendar.book && ctx.calendar.kind !== "calcom") {
        const r = await ctx.calendar.book({
          start, end,
          title: `${nameOf(svc.name, biz.default_lang)}: ${guest || "client"}`.slice(0, 120),
          description: `Booked by the chat assistant. Contact: ${contact}${msg.phone ? `, ${msg.phone}` : ""}. Language: ${lang}.`,
          capacity: svc.capacity || biz.booking.capacity || 1,
          reminderMin: biz.booking.owner_reminder_min || null,
        });
        if (!r.ok) {
          const again = await findSlots(ctx, svc, null, "any", now, lang);
          if (!again.length) { say(t(biz, lang, "no_slots")); return finish("no_slots", history); }
          await store.put(`p:${key}`, { service_id: svc.id, slots: again }, 7200);
          say(t(biz, lang, "slot_taken", { list: again.map((s, i) => `${i + 1}) ${s.label}`).join("\n") }));
          return finish("slot_taken", history);
        }
      } else if (ctx.calendar && ctx.calendar.kind === "calcom") {
        say(t(biz, lang, "link", { link: biz.booking.link })); return finish("link", history);
      }
      await store.del(`p:${key}`);
      say(t(biz, lang, biz.booking.kind === "call" ? "booked_call" : "booked", { service: nameOf(svc.name, lang), when: slot.label }));
      await tell(`${biz.name}: new booking: ${guest || "client"}, ${nameOf(svc.name, biz.default_lang)}, ${fmtSlot(start, biz.timezone, biz.default_lang)}, ${contact}`);
      res.booked = { service_id: svc.id, start: slot.start, guest };
      return finish("booked", history);
    }

    case "table": {
      if (mode !== "tables") break;
      const b = biz.booking;
      const guest = out.guest_name || "";
      const people = +out.people || 0;
      if (!out.date || !out.time || !people || !guest) { say(safe ? reply : t(biz, lang, "table_need")); return finish("table_need", history); }
      if (people > (b.max_party || 8)) return handover(`group of ${people}`);
      const dur = b.table_minutes || 120;
      const free = computeSlots({ ymd: out.date, hours: b.table_hours || biz.hours, exceptions: biz.exceptions, tz: biz.timezone, durationMin: dur, stepMin: 30, busy: await busyFor(ctx, out.date), notBefore: new Date(now.getTime() + (b.min_notice_min || 60) * 60000), capacity: b.tables || 1 });
      const want = zonedToDate(out.date, out.time, biz.timezone);
      const when = fmtSlot(want, biz.timezone, lang);
      if (!free.some((d) => d.getTime() === want.getTime())) {
        const list = free.slice(0, 4).map((d) => localParts(d, biz.timezone).hm).join(", ") || "-";
        say(t(biz, lang, "table_full", { when, list }));
        return finish("table_full", history);
      }
      const r = await ctx.calendar.book({ start: want, end: new Date(want.getTime() + dur * 60000), title: `Table ${people}p: ${guest}`, description: `Booked by the chat assistant. Contact: ${contact}.`, capacity: b.tables || 1 });
      if (!r.ok) { say(t(biz, lang, "table_full", { when, list: "-" })); return finish("table_full", history); }
      say(t(biz, lang, "table_ok", { people, when, guest }));
      await tell(`${biz.name}: table: ${guest}, ${people} people, ${fmtSlot(want, biz.timezone, biz.default_lang)}, ${contact}`);
      res.booked = { table: true, start: want.toISOString(), people, guest };
      return finish("table_ok", history);
    }

    case "request": {
      const summary = clean(out.summary || text, 200);
      say(t(biz, lang, "request_taken", { summary }));
      await tell(`${biz.name}: request from ${contact}: ${summary}`);
      return finish("request", history);
    }

    case "handover":
      return handover("bot does not know");
  }

  if (!safe) return handover(reply ? "unchecked sum or time in draft answer" : "no answer");
  say(reply);
  return finish("answer", history);
}

/* Anthropic needs user/assistant alternation starting with user */
function alternate(h) {
  const out = [];
  for (const m of h) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += `\n${m.content}`;
    else out.push({ ...m });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

function nameOf(x, lang) { return !x ? "" : typeof x === "string" ? x : x[lang] || x.en || Object.values(x)[0]; }

function bookable(biz, mode) {
  if (mode === "classes") return (biz.classes || []).map((c) => ({ ...c, duration_min: c.duration_min || 60 }));
  return (biz.services || []).filter((s) => s.bookable !== false && s.duration_min);
}
function pickService(biz, id, mode) {
  const list = bookable(biz, mode);
  if (id) { const s = list.find((x) => x.id === id); if (s) return s; }
  if (mode === "classes") { const trial = list.filter((c) => c.trial); if (trial.length && (!id || id === "trial")) return { id: "trial", name: biz.trial_name || "Trial", trial: true, duration_min: 60, __all: trial }; }
  return list.length === 1 ? list[0] : null;
}

async function busyFor(ctx, fromYmd, toYmd = fromYmd) {
  if (!ctx.calendar || !ctx.calendar.busy) return [];
  const tz = ctx.biz.timezone;
  return ctx.calendar.busy(zonedToDate(fromYmd, "00:00", tz), zonedToDate(addDays(toYmd, 1), "00:00", tz));
}

async function findSlots(ctx, svc, date, part, now, lang) {
  const { biz } = ctx;
  const b = biz.booking || {};
  const tz = biz.timezone;
  const today = localParts(now, tz).ymd;
  const days = date ? [date] : Array.from({ length: Math.min(b.days_ahead || 7, 14) }, (_, i) => addDays(today, i));
  const notBefore = new Date(now.getTime() + (b.min_notice_min || 120) * 60000);
  const max = b.offer_count || 3;
  let found = [];

  if (b.mode === "classes") {
    const classes = svc.__all || [svc];
    const busy = await busyFor(ctx, days[0], days[days.length - 1]);
    for (const ymd of days) {
      for (const c of classes) {
        if (!c.days.includes(weekdayOf(ymd))) continue;
        if (biz.exceptions && Array.isArray(biz.exceptions[ymd]) && biz.exceptions[ymd].length === 0) continue; /* closed that day */
        const s = zonedToDate(ymd, c.time, tz);
        if (s < notBefore || !inPart(s, tz, part)) continue;
        const e = new Date(s.getTime() + (c.duration_min || 60) * 60000);
        const taken = busy.filter((x) => Date.parse(x.start) < e && Date.parse(x.end) > s).length;
        if (taken < (c.capacity || 10)) found.push({ start: s.toISOString(), end: e.toISOString(), label: `${fmtSlot(s, tz, lang)} ${c.name}`, class_id: c.id });
      }
    }
    found.sort((a, b2) => Date.parse(a.start) - Date.parse(b2.start));
    return found.slice(0, max);
  }

  if (ctx.calendar && ctx.calendar.kind === "calcom") {
    const free = await ctx.calendar.free(zonedToDate(days[0], "00:00", tz), zonedToDate(addDays(days[days.length - 1], 1), "00:00", tz));
    return free.filter((d) => d >= notBefore && inPart(d, tz, part)).slice(0, max)
      .map((d) => ({ start: d.toISOString(), end: new Date(d.getTime() + svc.duration_min * 60000).toISOString(), label: fmtSlot(d, tz, lang) }));
  }

  const busy = await busyFor(ctx, days[0], days[days.length - 1]);
  for (const ymd of days) {
    const day = computeSlots({ ymd, hours: biz.hours, exceptions: biz.exceptions, tz, durationMin: svc.duration_min + (b.buffer_min || 0), stepMin: b.slot_step_min || 30, busy, notBefore, capacity: b.capacity || 1 })
      .filter((d) => inPart(d, tz, part));
    /* at most 2 per day so the customer sees a choice of days */
    found.push(...day.slice(0, date ? max : 2));
    if (found.length >= max) break;
  }
  return found.slice(0, max).map((d) => ({ start: d.toISOString(), end: new Date(d.getTime() + svc.duration_min * 60000).toISOString(), label: fmtSlot(d, tz, lang) }));
}
