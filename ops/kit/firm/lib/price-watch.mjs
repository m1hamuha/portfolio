/* Competitor prices on up to 20 public pages. Run once a night (Worker cron, Apps Script trigger or n8n),
   then send report() by e-mail. Config (JSON):
     { "lang": "de", "pages": [ { "name": "Firma A, Fenster 120x140", "url": "https://...", "pattern": "optional regex with one group" } ] }
   Rules built in, so the promise stays true:
     - at most 20 pages (MAX_PAGES), more throws;
     - no marketplaces (BLOCKED_HOSTS) and no pages behind a login: 401/403 is reported as a failure, never worked around;
     - robots.txt of each host is respected (Disallow for "*" or our agent);
     - a page that fails or where no price is found is listed under "check this page", so a broken page is visible.
   Price: from the config pattern, else from schema.org JSON-LD "price" (only if the page has exactly one price,
   otherwise the page is listed under "check this page" until a pattern is set), else from itemprop/og price meta. */

export const MAX_PAGES = 20;
export const BLOCKED_HOSTS = ["amazon.", "ebay.", "otto.de", "kaufland.", "zalando.", "etsy.", "idealo.", "check24.", "booking.com", "mydealz."];
const AGENT = "firm-price-watch";

export function validate(cfg) {
  const pages = cfg.pages || [];
  if (pages.length > MAX_PAGES) throw new Error(`at most ${MAX_PAGES} pages, got ${pages.length}`);
  for (const p of pages) {
    const u = new URL(p.url);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error(`bad url ${p.url}`);
    if (BLOCKED_HOSTS.some((h) => u.hostname.includes(h))) throw new Error(`marketplace not allowed: ${u.hostname}`);
  }
  return pages;
}

export function parsePrice(s) {
  let t = String(s).replace(/[^\d.,]/g, "");
  if (!t) return null;
  const lastC = t.lastIndexOf(","), lastD = t.lastIndexOf(".");
  if (lastC > lastD) t = t.replace(/\./g, "").replace(",", ".");
  else if (lastD > lastC && lastC >= 0) t = t.replace(/,/g, "");
  else if (lastD >= 0 && t.length - lastD === 4 && t.indexOf(".") === lastD) t = t.replace(".", "");
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function extractPrice(html, pattern) {
  if (pattern) {
    const m = new RegExp(pattern, "s").exec(html);
    return m ? parsePrice(m[1] ?? m[0]) : null;
  }
  const ld = [...new Set([...html.matchAll(/"price"\s*:\s*"?([\d.,]+)"?/g)].map((m) => parsePrice(m[1])).filter((n) => n != null))];
  if (ld.length > 1) return null; // several prices on the page (variants, related products): set a pattern instead of guessing
  if (ld.length === 1) return ld[0];
  const meta = /<meta[^>]+(?:itemprop="price"|property="(?:product|og):price:amount")[^>]+content="([\d.,]+)"/i.exec(html)
    || /<meta[^>]+content="([\d.,]+)"[^>]+(?:itemprop="price"|property="(?:product|og):price:amount")/i.exec(html);
  return meta ? parsePrice(meta[1]) : null;
}

export function robotsAllows(robotsTxt, path) {
  let applies = false, inAgents = false, rules = [];
  for (const raw of String(robotsTxt).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") {
      const hit = v === "*" || v.toLowerCase() === AGENT;
      applies = inAgents ? applies || hit : hit; // consecutive User-agent lines form one group
      inAgents = true;
      continue;
    }
    inAgents = false;
    if (applies && (k === "disallow" || k === "allow") && v) rules.push({ allow: k === "allow", p: v });
  }
  const hit = rules.filter((r) => path.startsWith(r.p)).sort((a, b) => b.p.length - a.p.length)[0];
  return !hit || hit.allow;
}

export async function check(cfg, prev = {}, fetchImpl = globalThis.fetch) {
  const pages = validate(cfg);
  const robots = {};
  const state = {}, changes = [], failures = [], same = [];
  for (const p of pages) {
    const u = new URL(p.url);
    try {
      if (!(u.origin in robots)) {
        const r = await fetchImpl(`${u.origin}/robots.txt`, { headers: { "user-agent": AGENT } });
        robots[u.origin] = r.ok ? await r.text() : "";
      }
      if (!robotsAllows(robots[u.origin], u.pathname)) { failures.push({ ...p, reason: "robots" }); continue; }
      const res = await fetchImpl(p.url, { headers: { "user-agent": AGENT } });
      if (res.status === 401 || res.status === 403) { failures.push({ ...p, reason: "login" }); continue; }
      if (!res.ok) { failures.push({ ...p, reason: `http ${res.status}` }); continue; }
      const price = extractPrice(await res.text(), p.pattern);
      if (price == null) { failures.push({ ...p, reason: "no price" }); continue; }
      state[p.url] = price;
      const old = prev[p.url];
      if (old != null && old !== price) changes.push({ ...p, old, price });
      else same.push({ ...p, price });
    } catch (e) {
      failures.push({ ...p, reason: String(e.message || e).slice(0, 80) });
    }
  }
  for (const f of failures) if (prev[f.url] != null) state[f.url] = prev[f.url];
  return { state, changes, failures, same };
}

const T = {
  en: { subj: "Competitor prices", ch: "Changed", fail: "Check this page", none: "No price changes.", same: "unchanged" },
  de: { subj: "Preise der Konkurrenz", ch: "Geändert", fail: "Seite bitte prüfen", none: "Keine Preisänderungen.", same: "unverändert" },
  uk: { subj: "Ціни конкурентів", ch: "Змінилися", fail: "Перевір цю сторінку", none: "Ціни не змінилися.", same: "без змін" },
  ru: { subj: "Цены конкурентов", ch: "Изменились", fail: "Проверь эту страницу", none: "Цены не изменились.", same: "без изменений" },
};

export function report(result, lang = "de") {
  const t = T[lang] || T.en;
  const out = [];
  if (result.changes.length) {
    out.push(`${t.ch}:`);
    for (const c of result.changes) out.push(`- ${c.name}: ${c.old} -> ${c.price} (${c.url})`);
  } else out.push(t.none);
  if (result.failures.length) {
    out.push("", `${t.fail}:`);
    for (const f of result.failures) out.push(`- ${f.name}: ${f.reason} (${f.url})`);
  }
  out.push("", `${result.same.length} ${t.same}`);
  return { subject: `${t.subj}: ${result.changes.length} / ${result.failures.length}`, body: out.join("\n") };
}
