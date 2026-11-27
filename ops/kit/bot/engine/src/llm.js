/* One small interface for any model: complete({ system, messages, maxTokens }) -> text.
   system: a string, or an array of Anthropic text blocks (to mark a long, stable part with cache_control).
   Provider is chosen by env.LLM_PROVIDER: "anthropic" (default), "workers-ai", or "mock" (tests, demos).
   The key lives only in a secret: wrangler secret put ANTHROPIC_API_KEY. */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function makeLLM(env, fetchImpl = fetch) {
  const provider = env.LLM_PROVIDER || "anthropic";

  if (provider === "anthropic") {
    const model = env.LLM_MODEL || "claude-haiku-5-5"; /* cheap and fast; "claude-sonnet-5-5" for harder FAQ */
    return {
      name: `anthropic:${model}`,
      async complete({ system, messages, maxTokens = 1024 }) {
        if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
        const res = await fetchImpl(env.ANTHROPIC_URL || ANTHROPIC_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system,
            messages,
            output_config: { effort: env.LLM_EFFORT || "low" },
          }),
        });
        if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json();
        if (data.stop_reason === "refusal") return "";
        return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      },
    };
  }

  if (provider === "workers-ai") {
    const model = env.LLM_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    return {
      name: `workers-ai:${model}`,
      async complete({ system, messages, maxTokens = 1024 }) {
        const sys = Array.isArray(system) ? system.map((b) => b.text).join("\n\n") : system;
        const out = await env.AI.run(model, { messages: [{ role: "system", content: sys }, ...messages], max_tokens: maxTokens });
        return out.response || "";
      },
    };
  }

  if (provider === "mock") {
    /* env.MOCK_REPLIES: array of strings or a function(system, messages) -> string */
    let i = 0;
    return {
      name: "mock",
      async complete({ system, messages }) {
        const r = env.MOCK_REPLIES;
        if (typeof r === "function") return r(system, messages);
        return Array.isArray(r) ? r[Math.min(i++, r.length - 1)] : "{}";
      },
    };
  }

  throw new Error(`unknown LLM_PROVIDER ${provider}`);
}

/* the model is asked for one JSON object; tolerate prose or code fences around it */
export function parseJSON(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
