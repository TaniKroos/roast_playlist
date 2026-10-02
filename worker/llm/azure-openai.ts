// Azure OpenAI. Picks the connection style from the endpoint shape (same rule CloudAgent uses):
//  - v1:      https://<res>.openai.azure.com/openai/v1  (or *.cognitiveservices / *.services.ai.azure.com)
//             → POST {endpoint}/chat/completions, model = deployment name, no api-version
//  - classic: https://<res>.openai.azure.com
//             → POST {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=…
// Both accept the `api-key` header. Newer model generations reject `max_tokens` and need
// `max_completion_tokens` (which also covers hidden reasoning tokens), and reasoning models
// only accept the default temperature.

import { postJson } from "./http";
import { ProviderError, type Adapter } from "./types";

interface ChatResponse {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function isV1Endpoint(endpoint: string): boolean {
  return /\/openai\/v1\/?$/.test(endpoint);
}

export const azureOpenai: Adapter = async (cfg, args, apiKey, signal, fetchImpl) => {
  if (!apiKey) throw new ProviderError("api key missing");
  if (!cfg.baseUrl || !cfg.model) throw new ProviderError("endpoint or deployment missing");
  const endpoint = cfg.baseUrl.replace(/\/+$/, "");

  const url = isV1Endpoint(endpoint)
    ? `${endpoint}/chat/completions`
    : `${endpoint}/openai/deployments/${encodeURIComponent(cfg.model)}/chat/completions?api-version=${encodeURIComponent(cfg.apiVersion ?? "2024-10-21")}`;

  const body: Record<string, unknown> = {
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    max_completion_tokens: args.maxTokens,
  };
  if (isV1Endpoint(endpoint)) body.model = cfg.model;
  if (!cfg.omitTemperature) body.temperature = args.temperature;
  if (cfg.reasoningEffort) body.reasoning_effort = cfg.reasoningEffort;
  if (cfg.jsonMode) body.response_format = { type: "json_object" };

  const data = (await postJson(fetchImpl, url, { "api-key": apiKey, ...cfg.headers }, body, signal)) as ChatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new ProviderError("empty completion");
  return { text, inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens };
};
