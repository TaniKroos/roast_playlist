// Sampling, truncation and cheap stats. Pure functions, no I/O.

import { LIMITS, type PlaylistStats, type Track } from "../shared/types";

export function truncate(s: string, max: number): string {
  const clean = s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + "…";
}

/** Cap at 60: first 20, 30 random from the middle (kept in order), last 10. */
export function sampleTracks(tracks: Track[], cap: number = LIMITS.trackCap, random: () => number = Math.random): Track[] {
  const clipped = tracks.map((t) => ({
    title: truncate(t.title, LIMITS.fieldMaxChars),
    artist: truncate(t.artist, LIMITS.fieldMaxChars),
  }));
  if (clipped.length <= cap) return clipped;

  const head = clipped.slice(0, 20);
  const tail = clipped.slice(-10);
  const middle = clipped.slice(20, clipped.length - 10);
  const need = cap - head.length - tail.length;

  // Partial Fisher-Yates over indices, then sort to keep playlist order.
  const idx = middle.map((_, i) => i);
  for (let i = 0; i < need; i++) {
    const j = i + Math.floor(random() * (idx.length - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const picked = idx.slice(0, need).sort((a, b) => a - b).map((i) => middle[i]);
  return [...head, ...picked, ...tail];
}

/** "Arijit Singh, Pritam" / "A & B" / "A feat. B" / "A x B" → "Arijit Singh" */
export function primaryArtist(artist: string): string {
  return artist
    .split(/\s*(?:,|&|\+|\/|;|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b|\sx\s|\sX\s|\sand\s)\s*/i)[0]
    .trim();
}

export function computeStats(tracks: Track[]): PlaylistStats {
  const counts = new Map<string, { artist: string; count: number }>();
  for (const t of tracks) {
    const name = primaryArtist(t.artist);
    if (!name || /^unknown$/i.test(name)) continue;
    const key = name.toLowerCase();
    const entry = counts.get(key) ?? { artist: name, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
  const top = sorted[0]?.count ?? 0;
  return {
    trackCount: tracks.length,
    topArtists: sorted.slice(0, 5),
    topArtistShare: tracks.length ? Math.round((top / tracks.length) * 100) : 0,
    uniqueArtists: counts.size,
  };
}
