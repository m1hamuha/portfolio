/* Checks that run before and after the model. They are deliberately dumb and strict. */

/* health and treatment words: in clinic set-ups such messages never go to the model, the practice answers */
const HEALTH = /(schmerz|blut|fieber|entzünd|geschwollen|medikament|antibiotik|diagnos|befund|symptom|krank|notfall|schwanger|allergi|zahnfleisch|eiter|pain|hurt|bleed|fever|swollen|medicine|pill|diagnos|symptom|sick|pregnan|infect|болит|боль|кров|температур|опух|воспал|лекарств|таблет|диагноз|симптом|беремен|аллерг|гно|болить|біль|кров|набряк|запален|ліки|вагітн|алерг)/i;
export function mentionsHealth(text) { return HEALTH.test(String(text || "")); }

/* every sum the reply names must be one of the sums in business.json */
const MONEY = /(?:€|eur\b|euro|евро|євро)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euro|евро|євро)/gi;
export function moneyIn(text) {
  const out = [];
  for (const m of String(text || "").matchAll(MONEY)) out.push(norm(m[1] || m[2]));
  return out;
}
function norm(s) { return String(s).replace(",", ".").replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1"); }

export function allowedSums(biz) {
  const set = new Set();
  for (const s of biz.services || []) if (s.price != null) set.add(norm(String(s.price)));
  for (const f of [...(biz.facts || []), ...(biz.faq || []).map((x) => x.a)]) for (const v of moneyIn(f)) set.add(v);
  for (const v of biz.allowed_sums || []) set.add(norm(String(v)));
  return set;
}

export function pricesOk(reply, biz) {
  const allowed = allowedSums(biz);
  return moneyIn(reply).every((v) => allowed.has(v));
}

/* the model must not invent times: any clock time in its reply must come from hours, facts or FAQ.
   Free times for booking are added by the engine, never by the model. */
const CLOCK = /(?<![€\d.,]\s?)\b([01]?\d|2[0-3])[:.]([0-5]\d)\b(?!\s*(?:€|eur\b|euro|евро|євро|[.,]\d))/gi;
function times(text) { return [...String(text || "").matchAll(CLOCK)].map((m) => `${m[1].padStart(2, "0")}:${m[2]}`); }
export function timesOk(reply, biz) {
  const src = [JSON.stringify(biz.hours || {}), JSON.stringify(biz.exceptions || {}), ...(biz.facts || []), ...(biz.faq || []).map((x) => x.a), ...(biz.classes || []).map((c) => JSON.stringify(c))].join(" ");
  const allowed = new Set(times(src));
  return times(reply).every((x) => allowed.has(x));
}

export function clean(s, n = 700) {
  return String(s || "").replace(/[\u2013\u2014]/g, "-").replace(/\*\*|__|#+\s/g, "").trim().slice(0, n);
}
