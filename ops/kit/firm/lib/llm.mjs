/* One call shape for all firm projects: complete({ system, user, maxTokens }) -> text.
   Provider from env LLM_PROVIDER:
     "bedrock-eu" (default) Claude on Amazon Bedrock, EU geo inference profile, key in AWS_BEARER_TOKEN_BEDROCK
                  (Bedrock API key), region in AWS_REGION (default eu-central-1). Keeps the site promise "stored in the EU".
     "anthropic"  Anthropic Messages API, key in ANTHROPIC_API_KEY. Inference region: not EU (see README), so it only
                  starts with LLM_ALLOW_NON_EU=yes, set after the firm agreed in writing.
     "mock"       tests and dry runs, reply from env MOCK_REPLY (string or function).
   Model in LLM_MODEL (default claude-haiku-5-5; claude-sonnet-5-5 for long or hard texts).
   No secrets in code. fetchImpl is injectable for offline tests. */

const BEDROCK_IDS = {
  "claude-haiku-5-5": "eu.anthropic.claude-haiku-5-5",
  "claude-sonnet-5-5": "eu.anthropic.claude-sonnet-5-5",
};

const RETRY = new Set([429, 500, 502, 503, 529]);

async function post(fetchImpl, url, headers, body, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    const res = await fetchImpl(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return res.json();
    last = `${res.status} ${await res.text().catch(() => "")}`.slice(0, 300);
    if (!RETRY.has(res.status)) break;
    await new Promise((r) => setTimeout(r, 50 * 2 ** i));
  }
  throw new Error(`LLM call failed: ${last}`);
}

function textOf(json) {
  return (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

export function makeLLM(env = process.env, fetchImpl = globalThis.fetch) {
  const provider = env.LLM_PROVIDER || "bedrock-eu";
  const model = env.LLM_MODEL || "claude-haiku-5-5";

  if (provider === "anthropic") {
    if (env.LLM_ALLOW_NON_EU !== "yes") throw new Error("anthropic runs outside the EU: set LLM_ALLOW_NON_EU=yes only with the firm's written consent, else use bedrock-eu");
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
    return {
      provider, model,
      async complete({ system, user, maxTokens = 2000 }) {
        const json = await post(fetchImpl, "https://api.anthropic.com/v1/messages", {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        }, { model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
        return textOf(json);
      },
    };
  }

  if (provider === "bedrock-eu") {
    if (!env.AWS_BEARER_TOKEN_BEDROCK) throw new Error("AWS_BEARER_TOKEN_BEDROCK missing");
    const region = env.AWS_REGION || "eu-central-1";
    if (!region.startsWith("eu-")) throw new Error(`bedrock-eu needs an EU region, got ${region}`);
    const id = env.BEDROCK_MODEL_ID || BEDROCK_IDS[model];
    if (!id) throw new Error(`no Bedrock EU id for ${model}, set BEDROCK_MODEL_ID`);
    if (!id.startsWith("eu.")) throw new Error(`Bedrock id must be an EU inference profile (eu.*), got ${id}`);
    return {
      provider, model: id,
      async complete({ system, user, maxTokens = 2000 }) {
        const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(id)}/invoke`;
        const json = await post(fetchImpl, url, {
          "content-type": "application/json",
          authorization: `Bearer ${env.AWS_BEARER_TOKEN_BEDROCK}`,
        }, { anthropic_version: "bedrock-2023-05-31", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
        return textOf(json);
      },
    };
  }

  if (provider === "mock") {
    return {
      provider, model,
      async complete(req) {
        const r = env.MOCK_REPLY;
        return typeof r === "function" ? r(req) : String(r ?? "");
      },
    };
  }

  throw new Error(`unknown LLM_PROVIDER ${provider}`);
}

/* Strip obvious personal and payment data before text goes to any model.
   Not a guarantee: names in free text stay. Use it on invoices, mails, notes. */
export function redact(text) {
  return String(text)
    .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g, "[IBAN]")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[EMAIL]")
    .replace(/(?:\+|00)\d[\d ()/-]{7,}\d|\b0\d{2,5}[ /-]?\d{3,}[\d -]*\d\b/g, "[PHONE]")
    .replace(/\b(?:Steuer-?ID|IdNr\.?|Steuernummer)[:\s]*[\d /]{8,}/gi, "[TAXID]");
}
