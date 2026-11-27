/* Monthly plan: which days get a post, which photo and which theme goes where. Pure logic, no I/O. */
import { NICHES } from "./niches.mjs";

const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/* all dates (YYYY-MM-DD) of a month that fall on the given weekdays */
export function monthDates(month, weekdays) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error(`bad month ${month}, use YYYY-MM`);
  const want = new Set(weekdays.map((w) => w.toLowerCase().slice(0, 3)));
  for (const w of want) if (!WD.includes(w)) throw new Error(`bad weekday ${w}`);
  const out = [];
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let d = 1; d <= days; d++) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (want.has(WD[dt.getUTCDay()])) out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

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
export function buildPlan(client, month, inbox = { photos: [], free: [] }) {
  const niche = NICHES[client.niche];
  if (!niche) throw new Error(`unknown niche ${client.niche}`);
  const s = client.schedule || {};
  const closed = new Set((client.special_dates || []).filter((x) => x.closed).map((x) => x.date));
  const candidates = monthDates(month, s.weekdays || ["tue", "fri"]).filter((d) => !closed.has(d));
  const want = s.posts_per_month || candidates.length;
  const dates = spread(candidates, want);
  const warnings = [];
  if (dates.length < want) warnings.push(`only ${dates.length} posting days in ${month} for ${want} posts; add weekdays`);

  const photos = inbox.photos || [];
  const free = (inbox.free || []).slice();
  const themes = niche.themes.map((t) => t[0]).filter((t) => t !== "free_slot" && t !== "member");
  let ti = 0;

  const slots = dates.map((date, i) => {
    const photo = photos[i] || null;
    let theme = themes[ti++ % themes.length];
    let freeText = null;
    /* a free slot is announced on the latest posting day not after it, so it is still in the future */
    const fIdx = free.findIndex((f) => !f.date || (f.date >= date && !dates.some((d2) => d2 > date && d2 <= f.date)));
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
