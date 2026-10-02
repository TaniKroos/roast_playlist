// Amazon Music without login: reads the public *embed widget* page
// (https://music.amazon.<tld>/embed/<playlistId>/), which Amazon serves for sites to embed and
// which renders the track list server-side (title + artist as aria-labels). Works for catalog
// playlists (B0… ASINs) and public user playlists. Like Spotify: lists at most ~100 tracks, may
// break if Amazon changes the widget, and failures fall back to paste mode. We deliberately do
// NOT call Amazon's internal web-player API.

import { AppError } from "../errors";
import { truncate } from "../playlist-utils";
import { LIMITS, type Playlist, type Track } from "../../shared/types";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const MAX_PAGE_BYTES = 2_000_000;

const unavailable = () =>
  new AppError("source_unavailable", "Amazon Music isn't cooperating right now. Paste your songs instead.", 502, "Amazon Music");
const hidden = () =>
  new AppError("private_playlist", "We can't see that Amazon Music playlist. It's private, deleted, or the link is wrong.", 404, "Amazon Music");

export async function fetchAmazonPlaylist(embedUrl: string, fetchImpl: typeof fetch = fetch): Promise<Playlist> {
  let html: string;
  try {
    const res = await fetchImpl(embedUrl, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(10_000) });
    if (res.status === 404 || res.status === 410) throw hidden();
    if (!res.ok) throw unavailable();
    html = await res.text();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw unavailable();
  }
  if (html.length > MAX_PAGE_BYTES) throw unavailable();
  const playlist = parseAmazonEmbed(html);
  if (!playlist) throw unavailable();
  return playlist;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export function parseAmazonEmbed(html: string): Playlist | null {
  const tracks: Track[] = [];
  // One <li> per track; title and artist live in aria-labels: "song, <title>" / "artist, <artist>".
  for (const row of html.split(/<li\b/).slice(1)) {
    const title = /aria-label="song, ([^"]*)"/.exec(row);
    if (!title) continue;
    const artist = /aria-label="artist, ([^"]*)"/.exec(row);
    tracks.push({ title: decodeEntities(title[1]), artist: artist ? decodeEntities(artist[1]) : "Unknown" });
  }
  if (!tracks.length) return null;
  const name = /<title>\s*Amazon Music - Playlist ([^<]*)<\/title>/.exec(html);
  return {
    source: "amazon",
    playlistName: truncate(name ? decodeEntities(name[1]) : "Amazon Music playlist", LIMITS.playlistNameMaxChars),
    tracks,
  };
}

/**
 * Amazon short links (amzn.to / amzn.in / amzn.eu …) redirect to the playlist page. Follow at most
 * 3 hops and only accept a final music.amazon.* playlist URL.
 */
export async function resolveAmazonShortLink(url: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const { parsePlaylistLink } = await import("../../shared/parse-url");
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const info = parsePlaylistLink(current);
    if (info.platform === "amazon" && info.embedUrl) return info.embedUrl;
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (u.protocol !== "https:" || !/^(amzn\.(to|in|eu|asia)|a\.co)$/.test(u.hostname)) return null;
    const res = await fetchImpl(u.toString(), { redirect: "manual", headers: { "user-agent": UA }, signal: AbortSignal.timeout(5000) });
    const loc = res.headers.get("location");
    if (!loc) return null;
    current = new URL(loc, u).toString();
  }
  return null;
}
