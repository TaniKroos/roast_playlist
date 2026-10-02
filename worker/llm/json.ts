// Provider-agnostic JSON extraction + schema validation. We never rely on native JSON mode.

import type { Roast } from "../../shared/types";

/** Strip <think> blocks and markdown fences, then take first "{" .. last "}". */
export function extractJson(text: string): unknown {
  let t = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
  // An unclosed/leading reasoning preamble ending in </think>
  const closeIdx = t.search(/<\/think(?:ing)?>/i);
  if (closeIdx >= 0) t = t.slice(closeIdx).replace(/^<\/think(?:ing)?>/i, "");
  t = t.replace(/```(?:json)?/gi, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object found");
  return JSON.parse(t.slice(start, end + 1));
}

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:\s]+$/, "") + "…";
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

/**
 * Validates the roast schema. Structure must be right (otherwise null → retry/fallback);
 * slightly-too-long strings are clipped rather than rejected, since models overshoot limits.
 */
export function validateRoast(value: unknown): Roast | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const verdict = str(v.verdict);
  const tasteLabel = str(v.tasteLabel);
  const redemption = str(v.redemption);
  if (!verdict || !tasteLabel || !redemption) return null;
  if (!Array.isArray(v.roastLines)) return null;
  const lines = v.roastLines.map(str).filter((l): l is string => !!l);
  if (lines.length < 3) return null;

  const score = typeof v.basicScore === "string" ? Number.parseInt(v.basicScore, 10) : v.basicScore;
  if (typeof score !== "number" || !Number.isFinite(score)) return null;

  const labelWords = tasteLabel.trim().split(/\s+/);
  return {
    verdict: clip(verdict, 90),
    tasteLabel: clip(labelWords.slice(0, 6).join(" "), 48),
    roastLines: lines.slice(0, 5).map((l) => clip(l, 160)),
    basicScore: Math.max(0, Math.min(100, Math.round(score))),
    redemption: clip(redemption, 120),
  };
}
