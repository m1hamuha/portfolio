import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { buildCardsPayload, submitCardsLead } from '../cards/lead-submission.mjs'

const cardsHtml = await readFile(new URL('../cards/index.html', import.meta.url), 'utf8')

const fields = {
  name: 'Mila Example',
  contact: '@mila',
  message: 'Handmade candles, 12 products',
  honey: '',
  language: 'uk',
  pageUrl: 'https://m1hamuha.github.io/portfolio/cards/?lang=uk#zayavka',
}

test('builds a traceable product-card request', () => {
  assert.deepEqual(
    buildCardsPayload(fields, {
      id: 'cards-fixed-id',
      submittedAt: '2026-08-16T12:00:00.000Z',
    }),
    {
      _subject: 'New lead — product cards site (EU)',
      _template: 'table',
      _honey: '',
      name: 'Mila Example',
      contact: '@mila',
      message: 'Handmade candles, 12 products',
      source: 'product-cards-contact',
      language: 'uk',
      page: 'https://m1hamuha.github.io/portfolio/cards/',
      submission_id: 'cards-fixed-id',
      submitted_at: '2026-08-16T12:00:00.000Z',
    },
  )
})

test('does not call the service when the honeypot is filled', async () => {
  let calls = 0
  const result = await submitCardsLead(
    { ...fields, honey: 'spam' },
    {
      endpoint: 'https://example.test/form',
      fetchImpl: async () => {
        calls += 1
        return Response.json({ success: true })
      },
    },
  )
  assert.equal(calls, 0)
  assert.deepEqual(result, { ok: true, filtered: true })
})

test('requires an explicit success response', async () => {
  const result = await submitCardsLead(fields, {
    endpoint: 'https://example.test/form',
    fetchImpl: async (_url, init) => {
      assert.equal(init.method, 'POST')
      assert.equal(init.headers.Accept, 'application/json')
      assert.equal(JSON.parse(init.body).contact, '@mila')
      return Response.json({ success: 'true' })
    },
  })
  assert.deepEqual(result, { ok: true, filtered: false })

  const ambiguous = await submitCardsLead(fields, {
    endpoint: 'https://example.test/form',
    fetchImpl: async () => Response.json({ message: 'unknown' }),
  })
  assert.deepEqual(ambiguous, { ok: false, reason: 'rejected' })
})

test('reports rate limits and timeouts separately', async (t) => {
  await t.test('rate limit', async () => {
    const result = await submitCardsLead(fields, {
      endpoint: 'https://example.test/form',
      fetchImpl: async () => Response.json({}, { status: 429 }),
    })
    assert.deepEqual(result, { ok: false, reason: 'rate-limit' })
  })

  await t.test('timeout', async () => {
    const result = await submitCardsLead(fields, {
      endpoint: 'https://example.test/form',
      timeoutMs: 5,
      fetchImpl: async (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    })
    assert.deepEqual(result, { ok: false, reason: 'timeout' })
  })
})

test('pricing requests a pack before payment, matching the no-upfront promise', () => {
  assert.doesNotMatch(cardsHtml, /paypal\.com\/cgi-bin\/webscr/i)
  assert.match(cardsHtml, /href="#zayavka"[^>]+data-pack="Starter pack — 5 product cards — €30"/)
  assert.match(cardsHtml, /href="#zayavka"[^>]+data-pack="Shopfront pack — 10 product cards — €50"/)
  assert.match(cardsHtml, /document\.querySelectorAll\('\[data-pack\]'\)/)
})

test('publishes complete sharing and language metadata', () => {
  assert.match(cardsHtml, /rel="alternate" hreflang="en"/)
  assert.match(cardsHtml, /rel="alternate" hreflang="uk"/)
  assert.match(cardsHtml, /property="og:title"/)
  assert.match(cardsHtml, /name="twitter:card" content="summary_large_image"/)
})
