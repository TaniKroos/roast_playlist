export interface GenerateArgs {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}

export interface ProviderConfig {
  name: string;
  type: "openai-compatible" | "anthropic" | "gemini" | "mock";
  model?: string;
  baseUrl?: string;
  /** Name of the env var holding the key. The key itself never lives in this JSON. */
  apiKeyEnv?: string;
  paid?: boolean;
  headers?: Record<string, string>;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Optional: ask the provider for native JSON mode (openai-compatible / gemini only). */
  jsonMode?: boolean;
  pricePerMTokIn?: number;
  pricePerMTokOut?: number;
  /** mock only: "ok" (default) | "fail" | "invalid" | "slow" — for tests and demos. */
  behavior?: "ok" | "fail" | "invalid" | "slow";
}

export interface GenerateResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

/** Thin adapter interface: one function per provider type. */
export type Adapter = (cfg: ProviderConfig, args: GenerateArgs, apiKey: string | undefined, signal: AbortSignal, fetchImpl: typeof fetch) => Promise<GenerateResult>;

export class ProviderError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}
