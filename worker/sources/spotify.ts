// Spotify without login: reads the public *embed* page (the widget sites use to embed a
// playlist), which ships the track list as JSON in <script id="__NEXT_DATA__">.
// Caveats (owner-approved trade-off, 2026-10-02): likely outside Spotify's developer terms,
// can break whenever Spotify changes the page, and the embed lists at most 100 tracks.
// Failures fall back to paste mode.

import { AppError } from "../errors";
import { truncate } from "../playlist-utils";
import { LIMITS, type Playlist, type Track } from "../../shared/types";

const UA = "Mozilla/5.0 (compatible; PlaylistRoaster/1.0)";
const ID = /^[A-Za-z0-9]{10,40}$/;

const unavailable = () =>
  new AppError("source_unavailable", "Spotify isn't cooperating right now. Paste your songs instead.", 502, "Spotify");
const hidden = () =>
  new AppError("private_playlist", "We can't see that Spotify playlist. It's private, deleted, or the link is wrong.", 404, "Spotify");

export async function fetchSpotifyPlaylist(playlistId: string, fetchImpl: typeof fetch = fetch): Promise<Playlist> {
  if (!ID.test(playlistId)) throw hidden();
  let html: string;
  try {
    const res = await fetchImpl(`https://open.spotify.com/embed/playlist/${playlistId}`, {
      headers: { "user-agent": UA, accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) throw hidden();
    if (!res.ok) throw unavailable();
    html = await res.text();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw unavailable();
  }
  return parseSpotifyEmbed(html);
}

export function parseSpotifyEmbed(html: string): Playlist {
  const m = /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw unavailable();
  let pageProps: Record<string, unknown>;
  try {
    pageProps = JSON.parse(m[1])?.props?.pageProps ?? {};
  } catch {
    throw unavailable();
  }

  const entity = (pageProps.state as { data?: { entity?: Record<string, unknown> } } | undefined)?.data?.entity;
  // Private / deleted / bogus ids render an error page: no entity, pageProps.status = 404/500.
  if (!entity) throw typeof pageProps.status === "number" ? hidden() : unavailable();

  const list = Array.isArray(entity.trackList) ? (entity.trackList as Record<string, unknown>[]) : [];
  const tracks: Track[] = list
    .filter((t) => typeof t.title === "string" && t.title)
    .map((t) => ({
      title: String(t.title),
      artist: typeof t.subtitle === "string" && t.subtitle ? t.subtitle.replace(/ /g, " ") : "Unknown",
    }));

  const name = typeof entity.name === "string" ? entity.name : typeof entity.title === "string" ? entity.title : "Spotify playlist";
  return { source: "spotify", playlistName: truncate(name, LIMITS.playlistNameMaxChars), tracks };
}

/**
 * Short share links (spotify.link/…) redirect to open.spotify.com/playlist/<id>. Follow at most
 * 3 hops, only ever requesting spotify.link / spotify.app.link / open.spotify.com.
 */
export async function resolveSpotifyShortLink(url: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const allowed = /^(spotify\.link|spotify\.app\.link|open\.spotify\.com)$/;
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    const direct = /\/playlist\/([A-Za-z0-9]{10,40})/.exec(u.pathname);
    if (u.hostname === "open.spotify.com" && direct) return direct[1];
    if (!allowed.test(u.hostname) || u.protocol !== "https:") return null;

    const res = await fetchImpl(u.toString(), { redirect: "manual", headers: { "user-agent": UA }, signal: AbortSignal.timeout(5000) });
    const loc = res.headers.get("location");
    if (loc) {
      current = new URL(loc, u).toString();
      continue;
    }
    // Some short links answer 200 with an HTML/JS redirect: look for the playlist URL in the body.
    const body = (await res.text()).slice(0, 200_000);
    const found = /open\.spotify\.com\/playlist\/([A-Za-z0-9]{10,40})/.exec(body);
    return found ? found[1] : null;
  }
  return null;
}
