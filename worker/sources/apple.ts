// Apple Music (stretch goal): reads the publicly rendered playlist page, no Apple API.
// The page embeds its data as JSON in <script id="serialized-server-data">. This is
// best-effort and may break when Apple changes the page; failures fall back to paste mode.

import { AppError } from "../errors";
import { truncate } from "../playlist-utils";
import { LIMITS, type Playlist, type Track } from "../../shared/types";

const MAX_PAGE_BYTES = 3_000_000;

export async function fetchApplePlaylist(url: string, fetchImpl: typeof fetch = fetch): Promise<Playlist> {
  const fail = () =>
    new AppError("source_unavailable", "Apple Music links are a bit moody right now. Paste your songs instead.", 502, "Apple Music");

  let html: string;
  try {
    const res = await fetchImpl(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; PlaylistRoaster/1.0)", accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) {
      throw new AppError("private_playlist", "We can't find that Apple Music playlist. Is it shared publicly?", 404, "Apple Music");
    }
    if (!res.ok) throw fail();
    html = await res.text();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw fail();
  }
  if (html.length > MAX_PAGE_BYTES) throw fail();

  const parsed = parseApplePage(html);
  if (!parsed) throw fail();
  return parsed;
}

export function parseApplePage(html: string): Playlist | null {
  const m = /<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return null;
  }

  const tracks: Track[] = [];
  let name = "";
  const visit = (node: unknown, depth: number): void => {
    if (depth > 12 || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n) => visit(n, depth + 1));
    const o = node as Record<string, unknown>;
    if (o.itemKind === "trackLockup" && Array.isArray(o.items)) {
      for (const it of o.items as Record<string, unknown>[]) {
        if (typeof it?.title === "string") {
          tracks.push({ title: it.title, artist: typeof it.artistName === "string" ? it.artistName : "Unknown" });
        }
      }
      return;
    }
    if (!name && typeof o.id === "string" && o.id.startsWith("playlist-detail-header") && typeof o.title === "string") {
      name = o.title;
    }
    for (const v of Object.values(o)) visit(v, depth + 1);
  };
  visit(data, 0);

  if (!tracks.length) return null;
  return {
    source: "apple",
    playlistName: truncate(name || "Apple Music playlist", LIMITS.playlistNameMaxChars),
    tracks,
  };
}
