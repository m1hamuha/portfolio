/* Small Google Apps Script shims: run .gs files in node, offline. UrlFetchApp calls a handler from the test. */
import vm from "node:vm";
import fs from "node:fs";
import crypto from "node:crypto";

export function loadGas(files, { props = {}, fetch = () => ({ code: 200, body: "{}" }) } = {}) {
  const store = { ...props };
  const log = { mail: [], fetch: [], triggers: [] };
  const ctx = {
    console,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in store ? store[k] : null),
      setProperty: (k, v) => { store[k] = String(v); },
      deleteProperty: (k) => { delete store[k]; },
      getProperties: () => ({ ...store }),
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    UrlFetchApp: { fetch: (url, opts = {}) => {
      log.fetch.push({ url, opts });
      const r = fetch(url, opts) || {};
      return { getResponseCode: () => r.code ?? 200, getContentText: () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {})) };
    } },
    MailApp: { sendEmail: (to, subject, body) => { if (log.failMailTo && log.failMailTo === to) throw new Error("Service invoked too many times for one day: email."); log.mail.push({ to, subject, body }); } },
    ScriptApp: {
      getOAuthToken: () => "fake-oauth-token",
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: (fn) => ({ timeBased: () => ({ everyHours: (h) => ({ create: () => log.triggers.push({ fn, h }) }) }) }),
    },
    Utilities: { computeHmacSha256Signature: (v, k) => [...crypto.createHmac("sha256", k).update(v).digest()].map((b) => (b > 127 ? b - 256 : b)) },
    HtmlService: { createHtmlOutput: (h) => ({ html: h, getContent: () => h }) },
  };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
  return { ctx, store, log };
}
