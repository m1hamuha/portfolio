/* Time helpers that work the same in Node and in Cloudflare Workers (both have full Intl).
   All business times are local to business.timezone; everything stored or sent to calendars is UTC ISO. */

const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/* minutes the zone is ahead of UTC at this instant (Berlin in winter: 60) */
export function tzOffsetMin(date, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/* "2026-11-28" + "11:00" in Europe/Berlin -> Date (UTC instant) */
export function zonedToDate(ymd, hm, tz) {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = tzOffsetMin(new Date(guess), tz);
  let t = guess - off * 60000;
  const off2 = tzOffsetMin(new Date(t), tz);
  if (off2 !== off) t = guess - off2 * 60000;
  return new Date(t);
}

/* Date -> local parts in the zone */
export function localParts(date, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  return { ymd: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}`, wd: p.weekday.slice(0, 3).toLowerCase() };
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function weekdayOf(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/* opening ranges for a local day: hours = { mon: ["09:00-18:00"], ... }, exceptions = { "2026-12-24": [] } */
export function rangesFor(ymd, hours, exceptions = {}) {
  const list = Object.prototype.hasOwnProperty.call(exceptions, ymd) ? exceptions[ymd] : hours[weekdayOf(ymd)] || [];
  return list.map((r) => r.split("-").map((s) => s.trim()));
}

/* Free start times. busy = [{start, end}] (ISO). capacity > 1 means up to N parallel bookings (tables, mats). */
export function computeSlots({ ymd, hours, exceptions, tz, durationMin, stepMin = 30, busy = [], notBefore, capacity = 1 }) {
  const out = [];
  const iv = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)]);
  for (const [from, to] of rangesFor(ymd, hours, exceptions)) {
    const startT = zonedToDate(ymd, from, tz).getTime();
    const endT = zonedToDate(ymd, to, tz).getTime();
    for (let s = startT; s + durationMin * 60000 <= endT; s += stepMin * 60000) {
      const e = s + durationMin * 60000;
      if (notBefore && s < notBefore.getTime()) continue;
      const overlaps = iv.filter(([bs, be]) => bs < e && be > s).length;
      if (overlaps < capacity) out.push(new Date(s));
    }
  }
  return out;
}

export function inPart(date, tz, part) {
  if (!part || part === "any") return true;
  const h = +localParts(date, tz).hm.slice(0, 2);
  if (part === "morning") return h < 12;
  if (part === "afternoon") return h >= 12 && h < 17;
  if (part === "evening") return h >= 17;
  return true;
}

export function fmtSlot(date, tz, lang) {
  const loc = { ru: "ru-RU", uk: "uk-UA", de: "de-DE", en: "en-GB" }[lang] || "en-GB";
  const day = new Intl.DateTimeFormat(loc, { timeZone: tz, weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
  const time = new Intl.DateTimeFormat(loc, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${day} ${time}`;
}
