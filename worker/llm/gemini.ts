// Native Gemini generateContent API (optional; the OpenAI-compatible endpoint also works).

import { postJson } from "./http";
import { ProviderError, type Adapter } from "./types";

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export const gemini: Adapter = async (cfg, args, apiKey, signal, fetchImpl) => {
  if (!apiKey) throw new ProviderError("api key missing");
  const base = (cfg.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  const data = (await postJson(
    fetchImpl,
    `${base}/models/${encodeURIComponent(cfg.model ?? "")}:generateContent`,
    { "x-goog-api-key": apiKey, ...cfg.headers },
    {
      systemInstruction: { parts: [{ text: args.system }] },
      contents: [{ role: "user", parts: [{ text: args.user }] }],
      generationConfig: {
        maxOutputTokens: args.maxTokens,
        temperature: args.temperature,
        ...(cfg.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    },
    signal,
  )) as GenerateContentResponse;
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("");
  if (!text) throw new ProviderError("empty completion");
  return { text, inputTokens: data.usageMetadata?.promptTokenCount, outputTokens: data.usageMetadata?.candidatesTokenCount };
};
