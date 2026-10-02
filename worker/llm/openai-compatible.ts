// POST {baseUrl}/chat/completions — GLM, Kimi, Groq, DeepSeek, Qwen, Mistral, OpenRouter,
// OpenAI, Gemini's OpenAI endpoint, Ollama/vLLM/LM Studio all speak this.

import { postJson } from "./http";
import { ProviderError, type Adapter } from "./types";

interface ChatResponse {
  choices?: { message?: { content?: string | null; reasoning_content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export const openaiCompatible: Adapter = async (cfg, args, apiKey, signal, fetchImpl) => {
  if (!cfg.baseUrl) throw new ProviderError("baseUrl missing");
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    max_tokens: args.maxTokens,
    temperature: args.temperature,
  };
  if (cfg.jsonMode) body.response_format = { type: "json_object" };

  const headers: Record<string, string> = { ...cfg.headers };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  const data = (await postJson(fetchImpl, `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`, headers, body, signal)) as ChatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new ProviderError("empty completion");
  return { text, inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens };
};
