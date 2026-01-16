// backend/services/llm.js (ESM)
function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function callLLM({
  messages,
  model = process.env.LLM_MODEL || "gpt-4o-mini",
  temperature = Number(process.env.LLM_TEMPERATURE || 0.4),
  max_tokens = Number(process.env.LLM_MAX_TOKENS || 900),
}) {
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com").replace(/\/$/, "");
  const apiKey = required("LLM_API_KEY");

  const url = `${baseUrl}/v1/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data) || `HTTP ${res.status}`;
    throw new Error(`LLM error: ${msg}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM returned empty content");

  return text;
}
