const DEFAULT_TIMEOUT_MS = 15_000

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cards-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cleanPage(rawUrl) {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'unknown'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch (_) {
    return 'unknown'
  }
}

export function buildCardsPayload(fields, options = {}) {
  return {
    _subject: 'New lead — product cards site (EU)',
    _template: 'table',
    _honey: fields.honey,
    name: fields.name.trim(),
    contact: fields.contact.trim(),
    message: fields.message.trim(),
    source: 'product-cards-contact',
    language: fields.language,
    page: cleanPage(fields.pageUrl),
    submission_id: options.id || newId(),
    submitted_at: options.submittedAt || new Date().toISOString(),
  }
}

export async function submitCardsLead(fields, options) {
  if (fields.honey.trim()) return { ok: true, filtered: true }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await (options.fetchImpl || fetch)(options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(buildCardsPayload(fields)),
      signal: controller.signal,
    })

    if (response.status === 429) return { ok: false, reason: 'rate-limit' }
    if (!response.ok) return { ok: false, reason: 'rejected' }
    const body = await response.json().catch(() => null)
    const accepted = body && (body.success === true || body.success === 'true')
    return accepted
      ? { ok: true, filtered: false }
      : { ok: false, reason: 'rejected' }
  } catch (error) {
    if (timedOut || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: false, reason: 'timeout' }
    }
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
  }
}
