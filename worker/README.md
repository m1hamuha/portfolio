# Portfolio assistant (Cloudflare Worker + Workers AI)

A tiny proxy between the site and a free Workers AI model. The site sends what the visitor wrote,
the model answers with JSON, the Worker checks that JSON against `catalog.json` (the same catalog the page
uses) and returns only known business and service ids, a short reply, or a draft message to the owner.
No API key is stored on the site.

## Deploy (about five minutes, free plan)

1. Create a free Cloudflare account: https://dash.cloudflare.com/sign-up
2. In a terminal on your computer:
   ```bash
   npm install -g wrangler
   wrangler login
   cd worker
   wrangler deploy
   ```
3. Wrangler prints an address like `https://portfolio-assistant.<your-name>.workers.dev`.
4. Put that address into `v-fast/index.html`, in `<meta name="chat-api" content="...">`
   (or give it to Claude and it will do it).

Until the address is set, the site uses the built-in word matcher, so nothing breaks.

## Limits and safety

- Free Workers AI allowance is 10,000 "neurons" a day; when it is used up, requests fail and the site
  falls back to the word matcher. No charge happens without a card on the account.
- Only `https://m1hamuha.github.io` may call it (`ALLOW_ORIGIN` in `wrangler.toml`).
- Burst guard: 12 requests per minute per address inside the Worker. For a hard limit, add one
  Cloudflare rate limiting rule (the free plan allows one) for the Worker route.
- Messages are cut to 400 characters and the last 6 turns; the model cannot add anything outside the catalog.
- The model name is in `DEFAULT_MODEL` in `index.js` (or the `MODEL` variable). Check the current
  list at https://developers.cloudflare.com/workers-ai/models/ and pick a multilingual one.
- To refresh the catalog after services change, run the page generator, which rewrites `catalog.json`.

## Test without Cloudflare

```bash
node worker/test.mjs
```
