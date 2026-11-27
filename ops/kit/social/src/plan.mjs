/* Monthly plan: which days get a post, which photo and which theme goes where. Pure logic, no I/O. */
import { NICHES } from "./niches.mjs";

const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/* period: "YYYY-MM" (a month) or "YYYY-MM-DD..YYYY-MM-DD" (a week or any range, both days included) */
export function periodRange(period) {
  const p = String(period || "");
  let m = p.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]);
    if (mo < 1 || mo > 12) throw new Error(`bad month ${p}, use YYYY-MM`);
    const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return [`${m[1]}-${m[2]}-01`, `${m[1]}-${m[2]}-${String(last).padStart(2, "0")}`];
  }
  m = p.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/);
  if (m && m[1] <= m[2]) return [m[1], m[2]];
  throw new Error(`bad period ${p}, use YYYY-MM or YYYY-MM-DD..YYYY-MM-DD`);
}

/* all dates (YYYY-MM-DD) in the period that fall on the given weekdays */
export function periodDates(period, weekdays) {
  const [from, to] = periodRange(period);
  const want = new Set(weekdays.map((w) => w.toLowerCase().slice(0, 3)));
  for (const w of want) if (!WD.includes(w)) throw new Error(`bad weekday ${w}`);
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (want.has(weekdayOf(d))) out.push(d);
  return out;
}
export const monthDates = periodDates;

/* pick n items spread evenly over the list (keeps first and last) */
export function spread(list, n) {
  if (n >= list.length) return list.slice();
  if (n <= 0) return [];
  if (n === 1) return [list[0]];
  const out = [];
  for (let i = 0; i < n; i++) out.push(list[Math.round((i * (list.length - 1)) / (n - 1))]);
  return [...new Set(out)];
}

export function weekdayOf(date) {
  return WD[new Date(date + "T12:00:00Z").getUTCDay()];
}

/* Build slots. client.schedule: { weekdays, posts_per_month, time }.
   inbox: { photos: [{file, note}], free: [{date?, text}] }  (free = free times from the owner)
   Returns { slots, warnings }. A slot without a photo is marked needs_photo. */
export function buildPlan(client, period, inbox = { photos: [], free: [] }) {
  const niche = NICHES[client.niche];
  if (!niche) throw new Error(`unknown niche ${client.niche}`);
  const s = client.schedule || {};
  const closed = new Set((client.special_dates || []).filter((x) => x.closed).map((x) => x.date));
  const candidates = periodDates(period, s.weekdays || ["tue", "fri"]).filter((d) => !closed.has(d));
  const isMonth = /^\d{4}-\d{2}$/.test(period);
  const want = Math.min(isMonth ? s.posts_per_month || candidates.length : candidates.length, candidates.length);
  const dates = spread(candidates, want);
  const warnings = [];
  if (isMonth && s.posts_per_month && candidates.length < s.posts_per_month) warnings.push(`only ${dates.length} posting days in ${period}; add weekdays`);

  const photos = inbox.photos || [];
  const free = (inbox.free || []).slice();
  const themes = niche.themes.map((t) => t[0]).filter((t) => t !== "free_slot" && t !== "member");
  let ti = 0;

  const slots = dates.map((date, i) => {
    const photo = photos[i] || null;
    let theme = themes[ti++ % themes.length];
    let freeText = null;
    /* a free slot is announced on the last posting day before it (never on the same day: too late to book) */
    const fIdx = free.findIndex((f) => !f.date || (f.date > date && !dates.some((d2) => d2 > date && d2 < f.date)));
    if (client.niche === "salon" && fIdx >= 0) {
      freeText = free.splice(fIdx, 1)[0].text;
      theme = "free_slot";
    }
    if (photo && /einverstanden|agreed|согласи|погоди/i.test(photo.note || "") && client.niche === "fitness") theme = "member";
    const special = (client.special_dates || []).find((x) => !x.closed && x.date >= date && x.date <= addDays(date, 6));
    return {
      n: i + 1,
      date,
      weekday: weekdayOf(date),
      time: s.time || "18:00",
      theme,
      photo: photo ? photo.file : null,
      note: photo ? photo.note || "" : "",
      free: freeText,
      special: special ? special.note : null,
      needs_photo: !photo,
    };
  });
  if (photos.length > slots.length) warnings.push(`${photos.length - slots.length} photos left over, keep them for next month`);
  if (photos.length < slots.length) warnings.push(`${slots.length - photos.length} posts have no photo yet: ask the owner`);
  return { slots, warnings };
}

export function addDays(date, n) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
