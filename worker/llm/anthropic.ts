// Native Claude Messages API.

import { postJson } from "./http";
import { ProviderError, type Adapter } from "./types";

interface MessagesResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

export const anthropic: Adapter = async (cfg, args, apiKey, signal, fetchImpl) => {
  if (!apiKey) throw new ProviderError("api key missing");
  const base = (cfg.baseUrl ?? "https://api.anthropic.com").replace(/\/+$/, "");
  const data = (await postJson(
    fetchImpl,
    `${base}/v1/messages`,
    { "x-api-key": apiKey, "anthropic-version": "2023-06-01", ...cfg.headers },
    {
      model: cfg.model,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
      max_tokens: args.maxTokens,
      temperature: args.temperature,
    },
    signal,
  )) as MessagesResponse;
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!text) throw new ProviderError("empty completion");
  return { text, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens };
};
