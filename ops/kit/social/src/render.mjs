/* Turns a finished plan into files: approval message for WhatsApp, CSV for scheduling, Markdown overview. Pure. */
import MSG from "../templates/messages.json" with { type: "json" };

const WD = {
  de: { mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa", sun: "So" },
  en: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
  ru: { mon: "пн", tue: "вт", wed: "ср", thu: "чт", fri: "пт", sat: "сб", sun: "вс" },
  uk: { mon: "пн", tue: "вт", wed: "ср", thu: "чт", fri: "пт", sat: "сб", sun: "нд" },
};

export function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export function msg(key, lang, vars = {}) {
  const m = MSG[key];
  if (!m) throw new Error(`no message ${key}`);
  return fill(m[lang] || m.en, vars);
}

const dmy = (d) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

export function fullCaption(p) {
  return [p.caption, (p.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
}

/* one WhatsApp message (owner language) with all posts, numbered */
export function approvalText(client, month, posts) {
  const lang = client.owner_language || "ru";
  const head = msg("approval_intro", lang, { month, name: client.name, n: posts.length });
  const body = posts.map((p) => {
    const day = (WD[lang] || WD.en)[p.weekday] || p.weekday;
    const photo = p.photo ? `[${p.photo}]` : "[photo missing]";
    const text = p.needs_photo ? msg("photo_missing", lang) : fullCaption(p);
    return `*${p.n}. ${day} ${dmy(p.date)} ${p.time}* ${photo}\n${text}`;
  });
  return [head, ...body, msg("approval_footer", lang)].join("\n\n");
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/* CSV for Mikhail: one row per post; columns fit a manual paste into the Business Suite planner */
export function planCSV(posts) {
  const head = ["n", "date", "time", "photo", "caption", "status_text", "alt", "check"];
  const rows = posts.map((p) => [p.n, p.date, p.time, p.photo || "", fullCaption(p), p.status_text, p.alt, (p.problems || []).join("; ")]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

export function planMarkdown(client, month, posts, warnings = []) {
  const lines = [`# ${client.name}: ${month}`, ""];
  if (warnings.length) lines.push("Warnings:", ...warnings.map((w) => `- ${w}`), "");
  for (const p of posts) {
    lines.push(`## ${p.n}. ${p.date} ${p.time} (${p.theme})`);
    lines.push(`Photo: ${p.photo || "MISSING"}${p.note ? `  \nNote: ${p.note}` : ""}${p.free ? `  \nFree slot: ${p.free}` : ""}`);
    lines.push("", fullCaption(p), "");
    if (p.status_text) lines.push(`Status: ${p.status_text}`, "");
    if (p.problems && p.problems.length) lines.push(`CHECK: ${p.problems.join("; ")}`, "");
  }
  return lines.join("\n");
}

/* Owner's WhatsApp reply to the approval message.
   "да" / "ok" / "ja" / "yes" / "так" / "👍"   -> { all: true, changes: [], unclear: false }
   "2: цена 7 €\n5 убрать"                     -> { all: false, changes: [{ n: 2, text: "цена 7 €" }, { n: 5, text: "убрать", drop: true }] }
   Posts not named in changes count as approved only if the reply also says yes ("да, но 2: ...").
   unclear: true means "Mikhail reads it himself, nothing is scheduled yet". This is the safe default:
   "да, но второй пост убери" or "ok aber Post 3 ohne Preis" must never count as a plain yes. */
const YES = /^\s*(да|ок|ok|okay|ja|jep|yes|так|добре|passt|gut|go|👍|✅)(?=$|[\s,.!)]|\p{Extended_Pictographic})/iu;
const DROP = /(убрать|убери|удалить|не надо|прибрати|прибери|видалити|weg|raus|löschen|remove|drop|skip)/i;
const ITEM = /(?:^|[\s,])(?:#|№|nr\.?\s*|пост\s*|post\s*)?(\d{1,2})\s*[:.)]\s+(.+)$/iu;
/* anything after the yes that looks like a wish: a number, "but", "only", "change", "without", a drop word */
const W = (w) => `(?<!\\p{L})${w}(?!\\p{L})`; /* whole word, also for Cyrillic (\b is ASCII only in JS) */
const BUT = new RegExp(["\\d", W("но"), "только", "кроме", "помен", "измен", "исправ", W("без"), W("але"), "тільки", "крім", "змін", "виправ", W("aber"), W("nur"), "außer", "änder", W("ohne"), W("but"), "except", W("only"), "change", "without", "instead", W("statt"), "вместо", "замість"].join("|"), "iu");
export function parseApproval(text) {
  const t = String(text || "").trim();
  const changes = [];
  for (const line of t.split(/\r?\n|;|,\s*(?=(?:#|№|nr\.?\s*|пост\s*|post\s*)?\d{1,2}\s*[:.)]\s)/iu)) {
    const m = line.match(ITEM);
    if (m) changes.push({ n: Number(m[1]), text: m[2].trim(), ...(DROP.test(m[2]) ? { drop: true } : {}) });
  }
  const yes = YES.test(t);
  const rest = t.replace(YES, "");
  const wordsLeft = rest.replace(/[\s\p{P}\p{S}\p{Extended_Pictographic}]/gu, "").length;
  const unclear = changes.length ? false : !yes || BUT.test(rest) || DROP.test(rest) || wordsLeft > 25;
  return { all: yes && !changes.length && !unclear, approvedRest: yes && !unclear, changes, unclear };
}
