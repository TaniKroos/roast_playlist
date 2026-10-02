// The rest of the app only calls generateRoast(). Providers are pure configuration.

import { anthropic } from "./anthropic";
import { gemini } from "./gemini";
import { extractJson, validateRoast } from "./json";
import { mock } from "./mock";
import { openaiCompatible } from "./openai-compatible";
import { ProviderError, type Adapter, type GenerateArgs, type ProviderConfig } from "./types";
import { JSON_NUDGE } from "../prompt";
import type { Roast } from "../../shared/types";

export type { ProviderConfig } from "./types";

const ADAPTERS: Record<ProviderConfig["type"], Adapter> = {
  "openai-compatible": openaiCompatible,
  anthropic,
  gemini,
  mock,
};

export const DEFAULTS = { maxTokens: 450, temperature: 0.9, timeoutMs: 20_000 };

export function parseProviders(json: string | undefined): ProviderConfig[] {
  if (!json) return [{ name: "mock", type: "mock", paid: false }];
  const list = JSON.parse(json) as ProviderConfig[];
  if (!Array.isArray(list) || !list.length) throw new Error("LLM_PROVIDERS must be a non-empty JSON array");
  for (const p of list) {
    if (!p.name || !(p.type in ADAPTERS)) throw new Error(`LLM_PROVIDERS: bad entry "${p.name ?? "?"}"`);
  }
  return list;
}

export interface ChainDeps {
  env: Record<string, unknown>;
  fetchImpl?: typeof fetch;
  /** Returns false once the daily paid-call cap is hit. */
  paidAllowed?: () => Promise<boolean>;
  /** Called once per request sent to a paid provider. */
  onPaidCall?: () => Promise<void>;
}

export interface ChainResult {
  roast: Roast;
  provider: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  attempts: { provider: string; outcome: string }[];
}

export class ChainError extends Error {
  constructor(
    public exhausted: boolean,
    public attempts: { provider: string; outcome: string }[],
  ) {
    super(exhausted ? "paid cap reached" : "all providers failed");
  }
}

/** The single entry point: { system, user } in, validated roast out (with fallback). */
export async function generateRoast(providers: ProviderConfig[], args: Omit<GenerateArgs, "maxTokens" | "temperature">, deps: ChainDeps): Promise<ChainResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const attempts: { provider: string; outcome: string }[] = [];
  let skippedPaid = false;

  for (const p of providers) {
    const key = p.apiKeyEnv ? (deps.env[p.apiKeyEnv] as string | undefined) : undefined;
    if (p.apiKeyEnv && !key) {
      attempts.push({ provider: p.name, outcome: "no api key" });
      continue;
    }
    const callArgs: GenerateArgs = {
      ...args,
      maxTokens: p.maxTokens ?? DEFAULTS.maxTokens,
      temperature: p.temperature ?? DEFAULTS.temperature,
    };

    // Up to two tries per provider: the second only after invalid JSON, with a nudge.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (p.paid) {
        if (deps.paidAllowed && !(await deps.paidAllowed())) {
          skippedPaid = true;
          attempts.push({ provider: p.name, outcome: "daily paid cap reached" });
          break;
        }
        await deps.onPaidCall?.();
      }
      const started = Date.now();
      try {
        const res = await ADAPTERS[p.type](
          p,
          attempt === 0 ? callArgs : { ...callArgs, user: callArgs.user + JSON_NUDGE },
          key,
          AbortSignal.timeout(p.timeoutMs ?? DEFAULTS.timeoutMs),
          fetchImpl,
        );
        let roast: Roast | null = null;
        try {
          roast = validateRoast(extractJson(res.text));
        } catch {
          roast = null;
        }
        if (!roast) {
          attempts.push({ provider: p.name, outcome: `invalid JSON (try ${attempt + 1})` });
          continue;
        }
        const cost =
          p.pricePerMTokIn != null && p.pricePerMTokOut != null && res.inputTokens != null && res.outputTokens != null
            ? (res.inputTokens * p.pricePerMTokIn + res.outputTokens * p.pricePerMTokOut) / 1e6
            : undefined;
        attempts.push({ provider: p.name, outcome: "ok" });
        return { roast, provider: p.name, latencyMs: Date.now() - started, inputTokens: res.inputTokens, outputTokens: res.outputTokens, estimatedCostUsd: cost, attempts };
      } catch (e) {
        const reason = e instanceof ProviderError ? e.message : e instanceof Error && /timeout|abort/i.test(e.name + e.message) ? "timeout" : "error";
        attempts.push({ provider: p.name, outcome: reason });
        break; // 429 / 5xx / timeout / anything else → next provider
      }
    }
  }
  throw new ChainError(skippedPaid, attempts);
}
