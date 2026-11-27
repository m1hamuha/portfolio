/* One small interface for any model: complete({ system, content, maxTokens }) -> text.
   content: a string or an array of Anthropic content blocks (text and image).
   Provider via env LLM_PROVIDER: "anthropic" (default) or "mock" (tests, dry runs).
   Key only from env ANTHROPIC_API_KEY. Model via env LLM_MODEL (default claude-haiku-5-5). */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function makeLLM(env = process.env, fetchImpl = globalThis.fetch) {
  const provider = env.LLM_PROVIDER || "anthropic";

  if (provider === "anthropic") {
    const model = env.LLM_MODEL || "claude-haiku-5-5";
    return {
      name: `anthropic:${model}`,
      vision: true,
      async complete({ system, content, maxTokens = 900 }) {
        if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set (or use --mock)");
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
            messages: [{ role: "user", content }],
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

  if (provider === "mock") {
    /* env.MOCK_REPLY: function({system, content}) -> string, or a fixed string */
    return {
      name: "mock",
      vision: false,
      async complete(args) {
        const r = env.MOCK_REPLY;
        if (typeof r === "function") return r(args);
        if (typeof r === "string") return r;
        return defaultMock(args);
      },
    };
  }

  throw new Error(`unknown LLM_PROVIDER ${provider}`);
}

/* Offline stand-in: a plain caption built only from the note, so dry runs show the flow. */
function defaultMock({ content }) {
  const text = Array.isArray(content) ? content.filter((b) => b.type === "text").map((b) => b.text).join("\n") : String(content);
  const note = (text.match(/OWNER NOTE: (.*)/) || [])[1] || "";
  const cta = (text.match(/CALL TO ACTION: (.*)/) || [])[1] || "";
  const caption = [note && note !== "(none)" ? note : "Neu bei uns.", cta].filter(Boolean).join("\n\n");
  return JSON.stringify({ caption, status_text: caption.split("\n")[0].slice(0, 120), alt: "Photo", hashtags: [] });
}

/* the model is asked for one JSON object; tolerate prose or code fences around it */
export function parseJSON(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
