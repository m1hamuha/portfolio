/* One small interface for any model: complete({ system, content, maxTokens }) -> text.
   content: a string, or an array of Anthropic content blocks (text and image, for review screenshots).
   Provider from env: LLM_PROVIDER = "anthropic" (default) | "mock". Key only from env ANTHROPIC_API_KEY.
   Same shape as ops/kit/bot/engine/src/llm.js, so a provider added there can be copied here. */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function makeLLM(env = process.env, fetchImpl = globalThis.fetch) {
  const provider = env.LLM_PROVIDER || "anthropic";
  if (provider === "anthropic") {
    /* Haiku is enough for short replies; set LLM_MODEL=claude-sonnet-5-5 for hard, angry reviews.
       Haiku 5.5 thinks by default and thinking counts against max_tokens, so keep max_tokens well above the reply length. */
    const model = env.LLM_MODEL || "claude-haiku-5-5";
    return {
      name: `anthropic:${model}`,
      async complete({ system, content, maxTokens = 2000 }) {
        if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
        const res = await fetchImpl(env.ANTHROPIC_URL || ANTHROPIC_URL, {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }], output_config: { effort: env.LLM_EFFORT || "low" } }),
        });
        if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json();
        if (data.stop_reason === "refusal") return "";
        return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      },
    };
  }
  if (provider === "mock") {
    let i = 0;
    return {
      name: "mock",
      async complete(req) {
        const r = env.MOCK_REPLIES;
        if (typeof r === "function") return r(req);
        return Array.isArray(r) ? r[Math.min(i++, r.length - 1)] : '{"reply":"Thank you!","lang":"en","needs_owner_ok":false,"flags":[]}';
      },
    };
  }
  throw new Error(`unknown LLM_PROVIDER ${provider}`);
}
