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
    return `*${p.n}. ${day} ${dmy(p.date)} ${p.time}* ${photo}\n${fullCaption(p)}`;
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
