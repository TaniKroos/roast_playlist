// Usage: npm run llm:test -- <providerName> [--hinglish] [--file songs.txt] [--tracks N]
// Sends a sample playlist to ONE provider from LLM_PROVIDERS (read from .dev.vars / env)
// and prints the parsed roast, latency, and estimated cost.

import { readFileSync, existsSync } from "node:fs";
import { generateRoast, parseProviders } from "../worker/llm";
import { computeStats, sampleTracks } from "../worker/playlist-utils";
import { buildSystemPrompt, buildUserPrompt } from "../worker/prompt";
import { parsePastedSongs } from "../worker/sources/paste";

function loadDevVars(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(".dev.vars")) return out;
  for (const line of readFileSync(".dev.vars", "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

const SAMPLE = `Tum Hi Ho - Arijit Singh
Channa Mereya - Arijit Singh
Kesariya - Arijit Singh
Brown Munde - AP Dhillon
Excuses - AP Dhillon
Blue Eyes - Yo Yo Honey Singh
Lungi Dance - Yo Yo Honey Singh
Cruel Summer - Taylor Swift
Blinding Lights - The Weeknd
Kho Gaye Hum Kahan - Prateek Kuhad
Husn - Anuv Jain
Satranga - Arijit Singh`;

const name = process.argv[2];
const hinglish = process.argv.includes("--hinglish");
const argVal = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const file = argVal("--file");
const wantTracks = Number(argVal("--tracks")) || 0;
const env = { ...loadDevVars(), ...process.env } as Record<string, string>;
const providers = parseProviders(env.LLM_PROVIDERS);

if (!name) {
  console.log("Usage: npm run llm:test -- <providerName> [--hinglish]\nConfigured providers:", providers.map((p) => p.name).join(", "));
  process.exit(1);
}
const provider = providers.find((p) => p.name === name);
if (!provider) {
  console.error(`No provider "${name}" in LLM_PROVIDERS. Configured: ${providers.map((p) => p.name).join(", ")}`);
  process.exit(1);
}

// --file: paste-format song list (one "Song - Artist" per line). --tracks N: cycle it up to N lines.
let lines = (file ? readFileSync(file, "utf8") : SAMPLE).split("\n").filter((l) => l.trim());
if (wantTracks) lines = Array.from({ length: wantTracks }, (_, i) => lines[i % lines.length]);
const playlist = { ...parsePastedSongs(lines.join("\n").slice(0, 60_000)) };
const stats = computeStats(playlist.tracks);
const t0 = Date.now();
try {
  const res = await generateRoast(
    [provider],
    { system: buildSystemPrompt(hinglish ? "hinglish" : "english"), user: buildUserPrompt({ ...playlist, tracks: sampleTracks(playlist.tracks, Number(env.LLM_MAX_TRACKS) || undefined) }, stats) },
    { env },
  );
  console.log(JSON.stringify(res.roast, null, 2));
  console.log(`\ntracks:   ${stats.trackCount} sent to the model`);
  console.log(`provider: ${res.provider} (${provider.model ?? provider.type})`);
  console.log(`latency:  ${res.latencyMs} ms (total ${Date.now() - t0} ms incl. retries)`);
  console.log(`tokens:   in ${res.inputTokens ?? "?"} / out ${res.outputTokens ?? "?"}`);
  if (res.estimatedCostUsd != null) {
    console.log(`cost:     $${res.estimatedCostUsd.toFixed(6)} per roast (~₹${(res.estimatedCostUsd * 88).toFixed(4)})`);
  } else {
    console.log("cost:     set pricePerMTokIn / pricePerMTokOut on this provider to estimate");
  }
  console.log(`attempts: ${res.attempts.map((a) => `${a.provider}=${a.outcome}`).join(", ")}`);
} catch (e) {
  console.error("FAILED:", (e as { attempts?: unknown }).attempts ?? (e as Error).message);
  process.exit(1);
}
