/* Find duplicate customers in a list (CSV export from CRM, shop, mail tool).
   Rules, no AI: same e-mail, same phone (digits, German 0 -> +49), or same normalised company/name + postcode.
   Returns groups of row indexes. Nothing is merged or deleted: a person decides per group. */

const UML = { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" };
const LEGAL = /\b(gmbh|ug|ag|kg|ohg|ek|e\.k\.|gbr|mbh|co|und|haftungsbeschraenkt)\b/g;

export function normEmail(e) {
  const s = String(e || "").trim().toLowerCase();
  if (!s.includes("@")) return "";
  let [u, d] = s.split("@");
  if (d === "googlemail.com") d = "gmail.com";
  if (d === "gmail.com") u = u.split("+")[0].replace(/\./g, "");
  return `${u}@${d}`;
}

export function normPhone(p, cc = "49") {
  let d = String(p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = cc + d.slice(1);
  return d.length >= 8 ? d : "";
}

export function normName(n) {
  return String(n || "").toLowerCase().replace(/[äöüß]/g, (c) => UML[c])
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,()"'/&-]/g, " ").replace(LEGAL, " ").replace(/\s+/g, " ").trim();
}

export function findDuplicates(rows, map = { name: "name", email: "email", phone: "phone", zip: "zip" }) {
  const parent = rows.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const seen = new Map();
  rows.forEach((r, i) => {
    const keys = [
      normEmail(r[map.email]) && "e:" + normEmail(r[map.email]),
      normPhone(r[map.phone]) && "p:" + normPhone(r[map.phone]),
      normName(r[map.name]) && r[map.zip] && "n:" + normName(r[map.name]) + "|" + String(r[map.zip]).trim(),
    ].filter(Boolean);
    for (const k of keys) {
      if (seen.has(k)) parent[find(i)] = find(seen.get(k));
      else seen.set(k, i);
    }
  });
  const groups = new Map();
  rows.forEach((_, i) => { const g = find(i); groups.set(g, [...(groups.get(g) || []), i]); });
  return [...groups.values()].filter((g) => g.length > 1);
}
