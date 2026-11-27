/* One small interface for any model: complete({ system, user, maxTokens }) -> text.
   Provider from env: LLM_PROVIDER = "anthropic" (default) | "mock". Key only from env ANTHROPIC_API_KEY.
   Swap model with LLM_MODEL (default claude-sonnet-5-5: the ad is read by people, worth the better model;
   claude-haiku-5-5 also works and costs less). Raw HTTP on purpose: no npm install, tests mock fetch. */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function makeLLM(env = process.env, fetchImpl = globalThis.fetch) {
  const provider = env.LLM_PROVIDER || "anthropic";
  if (provider === "anthropic") {
    const model = env.LLM_MODEL || "claude-sonnet-5-5";
    return {
      name: `anthropic:${model}`,
      async complete({ system, user, maxTokens = 4000 }) {
        if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
        const body = { model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }], output_config: { effort: env.LLM_EFFORT || "low" } };
        const headers = { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" };
        if (model.startsWith("claude-sonnet-5-5")) {
          /* if a safety classifier declines, the API retries on a fallback model by itself */
          body.fallbacks = "default";
          headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
        }
        /* retry overload / rate limit / 5xx twice with a short pause; 4xx (bad request, bad key) fail at once */
        let res;
        for (let attempt = 0; ; attempt++) {
          res = await fetchImpl(env.ANTHROPIC_URL || ANTHROPIC_URL, { method: "POST", headers, body: JSON.stringify(body) });
          const retry = res.status === 429 || res.status >= 500;
          if (!retry || attempt >= 2) break;
          const wait = Number(res.headers?.get?.("retry-after")) * 1000 || 2000 * (attempt + 1);
          await new Promise((r) => setTimeout(r, Math.min(wait, 20000) * (env.LLM_RETRY_SCALE ?? 1)));
        }
        if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json();
        if (data.stop_reason === "refusal") throw new Error("model declined the request");
        if (data.stop_reason === "max_tokens") throw new Error("answer cut off: raise maxTokens");
        return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      },
    };
  }
  if (provider === "mock") {
    return { name: "mock", async complete(req) { return typeof env.MOCK_REPLY === "function" ? env.MOCK_REPLY(req) : env.MOCK_REPLY; } };
  }
  throw new Error(`unknown LLM_PROVIDER ${provider}`);
}
