// Built-in "mock" provider: a template roaster that needs no API key. It reads the
// same prompt a real model gets, so the whole pipeline (and the UI) can be exercised
// locally and in tests. Not meant for production roasts.

import { DATA_CLOSE, DATA_OPEN } from "../prompt";
import { ProviderError, type Adapter } from "./types";

interface Payload {
  playlistName: string;
  stats: { totalTracks: number; topArtists: { artist: string; count: number }[]; topArtistSharePercent: number; uniqueArtists: number };
  tracks: [string, string][];
}

const VIBES: [RegExp, string, string][] = [
  [/arijit|atif|jubin|kk\b|mohit chauhan|darshan raval|papon/i, "sad-boi Bollywood", "dard bhare gaane"],
  [/honey singh|badshah|raftaar|guru randhawa|neha kakkar|tony kakkar/i, "2014 club remix", "remix wali party"],
  [/diljit|ap dhillon|karan aujla|sidhu|shubh|imran khan|gurinder|harrdy|b praak/i, "Punjabi gym-bro", "Punjabi bass"],
  [/taylor swift|olivia rodrigo|sabrina|gracie abrams|conan gray/i, "main-character pop", "Swiftie breakup arc"],
  [/drake|travis|kanye|kendrick|21 savage|future|metro boomin/i, "aux-cord rapper", "rapper wala attitude"],
  [/weeknd|lana|billie|frank ocean|sza|daniel caesar/i, "3am in a dark room", "raat ke 3 baje wali vibe"],
  [/coldplay|imagine dragons|one republic|maroon 5|ed sheeran|charlie puth/i, "school-fest Western", "school annual day"],
  [/lofi|lo-fi|slowed|reverb/i, "slowed + reverb", "slowed + reverb"],
  [/prateek kuhad|anuv jain|local train|when chai met toast|lifafa|ritviz/i, "indie café", "indie chai-tapri"],
  [/rahman|lata|kishore|rafi|asha|mukesh|r\.?d\.? burman/i, "parents' car playlist", "papa ki car"],
  [/bts|blackpink|stray kids|newjeans|twice|seventeen/i, "K-pop stan", "K-pop stan"],
];

const pick = <T>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];
const titleCase = (s: string) => s.replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());

export const mock: Adapter = async (cfg, args, _key, signal) => {
  const wait = cfg.behavior === "slow" ? 25_000 : 1600;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, wait);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(new ProviderError("timeout"))));
  });
  if (cfg.behavior === "fail") throw new ProviderError("HTTP 503", 503);
  if (cfg.behavior === "invalid") return { text: "Sure! Here's a roast: your playlist is mid." };

  const start = args.user.indexOf(DATA_OPEN + "\n");
  const end = args.user.lastIndexOf(DATA_CLOSE);
  const raw = JSON.parse(args.user.slice(start + DATA_OPEN.length, end)) as Payload;
  const data = { ...raw, tracks: raw.tracks.map(([title, artist]) => ({ title, artist })) };
  const hinglish = /Language: HINGLISH/.test(args.system);

  const top = data.stats.topArtists[0]?.artist ?? "Unknown Artist";
  const second = data.stats.topArtists[1]?.artist ?? top;
  const share = data.stats.topArtistSharePercent;
  const n = data.stats.totalTracks;
  const uniq = data.stats.uniqueArtists;
  const seed = data.tracks.reduce((a, t) => a + t.title.length * 31 + t.artist.length, n);
  const song = pick(data.tracks, seed)?.title ?? "that one song";
  const song2 = pick(data.tracks, seed * 7 + 3)?.title ?? song;
  const allArtists = data.tracks.map((t) => t.artist).join(" ");
  const vibe = VIBES.find(([re]) => re.test(allArtists)) ?? [/./, "algorithm-fed", "algorithm ka gulaam"];
  const score = Math.min(97, Math.max(18, 40 + share + (uniq < 8 ? 20 : 0) - Math.min(25, uniq) + (seed % 11)));

  const en = {
    verdict: pick([`This playlist has ${vibe[1]} energy and zero plot twists.`, `${n} songs and somehow one personality: ${top}.`, `Your aux privileges have been formally revoked.`], seed),
    tasteLabel: titleCase(pick([`Certified ${top} Hostage`, `${vibe[1]} Survivor`, `Professional Replay Button Presser`], seed + 1)),
    roastLines: [
      `${share}% ${top}? That's not a playlist, that's a fan club with a WiFi password.`,
      `"${song}" is on here like it's paying rent. We both know you skip to it every single time.`,
      `${uniq} unique artists across ${n} tracks — Spotify Wrapped is going to need therapy.`,
      `Going from ${top} to ${second} isn't range, it's the same mood in a different hoodie.`,
      `"${song2}" tells me you've had at least one dramatic window-staring car ride this month.`,
    ],
    redemption: `Okay, "${song}" is a genuinely good pick. One out of ${n}, but still.`,
  };
  const hi = {
    verdict: pick([`Bhai yeh playlist nahi, ${vibe[2]} ka full syllabus hai.`, `${n} gaane aur personality sirf ek: ${top}.`, `Aux cord tujhe dena ab illegal hai, sorry.`], seed),
    tasteLabel: titleCase(pick([`${top} Ka Pakka Fan`, `Certified ${vibe[2]} Victim`, `Repeat Button Ka Rishtedaar`], seed + 1)),
    roastLines: [
      `${share}% sirf ${top}? Bhai, restraining order lene ka time aa gaya hai.`,
      `"${song}" yahan aise baitha hai jaise rent bhar raha ho. Har baar wahi skip karke aata hai na tu?`,
      `${n} gaano mein sirf ${uniq} artists — itni loyalty toh rishton mein bhi nahi milti.`,
      `${top} se ${second} jaana range nahi hai, same mood bas kapde badal ke aaya hai.`,
      `"${song2}" sun ke lagta hai tu auto mein bhi window pe sar rakh ke music video shoot karta hai.`,
    ],
    redemption: `Chal theek hai, "${song}" sach mein accha gaana hai. ${n} mein se ek, par hai toh.`,
  };
  const r = hinglish ? hi : en;
  return {
    text: "```json\n" + JSON.stringify({ ...r, roastLines: r.roastLines.slice(0, 3 + (seed % 3)), basicScore: score }) + "\n```",
    inputTokens: Math.round(args.user.length / 4),
    outputTokens: 300,
  };
};
