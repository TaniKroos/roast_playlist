// POST /api/roast and GET /api/config. Stateless: no DB, no logging of request data.

import { AppError } from "./errors";
import { dailyPaidCounter, verifyTurnstile } from "./guards";
import { ChainError, generateRoast, parseProviders } from "./llm";
import { computeStats, sampleTracks } from "./playlist-utils";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { loadPlaylist } from "./sources";
import { LIMITS, type Language, type PublicConfig, type RoastRequest, type RoastResponse } from "../shared/types";

export interface Env {
  ASSETS: Fetcher;
  ROAST_LIMITER?: RateLimit;
  COUNTERS?: KVNamespace;
  LLM_PROVIDERS?: string;
  DAILY_PAID_ROAST_LIMIT?: string;
  LLM_MAX_TRACKS?: string;
  YOUTUBE_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  [key: string]: unknown;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const fail = (e: AppError) => json({ ok: false, code: e.code, message: e.message, platform: e.platform } satisfies RoastResponse, e.status);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/config" && request.method === "GET") {
      return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "" } satisfies PublicConfig);
    }
    if (url.pathname === "/api/roast") {
      if (request.method !== "POST") return json({ ok: false, code: "bad_request", message: "POST only" }, 405);
      try {
        return await handleRoast(request, env);
      } catch (e) {
        if (e instanceof AppError) return fail(e);
        // Log only the error class, never request data or LLM text.
        console.error("roast failed:", e instanceof Error ? e.name : "unknown");
        return fail(new AppError("roaster_choked", "The roaster choked on your playlist. Try again?", 500));
      }
    }
    if (url.pathname.startsWith("/api/")) return json({ ok: false, code: "bad_request", message: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function readBody(request: Request): Promise<RoastRequest> {
  const text = await request.text();
  if (text.length > 80_000) throw new AppError("too_long", "Request too large.", 413);
  let body: Partial<RoastRequest>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError("bad_request", "Bad request.");
  }
  const mode = body.mode === "paste" ? "paste" : body.mode === "link" ? "link" : null;
  const language: Language = body.language === "hinglish" ? "hinglish" : "english";
  if (!mode || typeof body.input !== "string" || !body.input.trim()) throw new AppError("bad_request", "Give us a playlist link or some songs first.");
  return { mode, input: body.input, language, turnstileToken: typeof body.turnstileToken === "string" ? body.turnstileToken : "" };
}

async function handleRoast(request: Request, env: Env): Promise<Response> {
  const req = await readBody(request);

  // ~5/min per client. The IP is only used as the in-memory limiter key for this call.
  if (env.ROAST_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") ?? "anon";
    const { success } = await env.ROAST_LIMITER.limit({ key: ip });
    if (!success) throw new AppError("rate_limited", "Easy there, DJ. Max 5 roasts a minute. Take a breath.", 429);
  }

  if (!(await verifyTurnstile(req.turnstileToken, env.TURNSTILE_SECRET))) {
    throw new AppError("captcha_failed", "We couldn't confirm you're human. Refresh and try again.", 403);
  }

  const loaded = await loadPlaylist(req.mode, req.input, env);
  const playlist = { ...loaded, tracks: loaded.tracks.slice(0, LIMITS.maxPlaylistTracks) };
  if (!playlist.tracks.length) throw new AppError("empty_playlist", "That playlist is empty. Even we can't roast silence.", 422);

  const stats = computeStats(playlist.tracks);
  const llmCap = Math.max(10, Math.min(LIMITS.maxPlaylistTracks, Number(env.LLM_MAX_TRACKS) || LIMITS.trackCap));
  const sampled = { ...playlist, tracks: sampleTracks(playlist.tracks, llmCap) };

  const limit = Number(env.DAILY_PAID_ROAST_LIMIT ?? 300);
  const counter = dailyPaidCounter(env.COUNTERS);
  let result;
  try {
    result = await generateRoast(
      parseProviders(env.LLM_PROVIDERS),
      { system: buildSystemPrompt(req.language), user: buildUserPrompt(sampled, stats) },
      { env, paidAllowed: async () => (await counter.get()) < limit, onPaidCall: () => counter.increment() },
    );
  } catch (e) {
    if (e instanceof ChainError) {
      // Provider names + outcomes only — no prompt or response text.
      console.warn("llm chain failed:", JSON.stringify(e.attempts));
      if (e.exhausted) throw new AppError("exhausted", "The roaster is exhausted for today. Come back tomorrow with fresh shame.", 503);
      throw new AppError("roaster_choked", "The roaster choked on your playlist. Try again?", 502);
    }
    throw e;
  }

  return json({
    ok: true,
    roast: result.roast,
    meta: { source: playlist.source, playlistName: playlist.playlistName, stats },
  } satisfies RoastResponse);
}
