// YouTube / YouTube Music via YouTube Data API v3 with an API key (no OAuth).
// Quota: playlists.list and playlistItems.list cost 1 unit each; default quota is 10,000 units/day.

import { AppError } from "../errors";
import { cleanYoutubeTitle } from "../clean-title";
import { truncate } from "../playlist-utils";
import { LIMITS, type Playlist, type Track } from "../../shared/types";

const API = "https://www.googleapis.com/youtube/v3";
/** Hard guard: one roast never makes more than this many YouTube calls. */
export const MAX_YT_CALLS = 3;

interface PlaylistsResponse {
  items?: { snippet?: { title?: string }; contentDetails?: { itemCount?: number } }[];
}
interface ItemsResponse {
  nextPageToken?: string;
  items?: { snippet?: { title?: string; videoOwnerChannelTitle?: string } }[];
}

export async function fetchYoutubePlaylist(listId: string, apiKey: string | undefined, fetchImpl: typeof fetch = fetch): Promise<Playlist> {
  if (!apiKey) {
    throw new AppError("source_unavailable", "YouTube links aren't switched on here yet. Paste your songs instead.", 503, "YouTube");
  }

  let calls = 0;
  const call = async <T>(path: string, params: Record<string, string>): Promise<T> => {
    if (++calls > MAX_YT_CALLS) throw new Error("youtube call budget exceeded");
    const qs = new URLSearchParams({ ...params, key: apiKey });
    const res = await fetchImpl(`${API}/${path}?${qs}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404) throw new AppError("private_playlist", "We can't see that playlist. It's private, deleted, or a personal mix.", 404, "YouTube");
    if (res.status === 403) throw new AppError("source_unavailable", "YouTube is rate-limiting us today. Paste your songs instead.", 503, "YouTube");
    if (!res.ok) throw new AppError("source_unavailable", "YouTube didn't answer. Try again or paste your songs.", 502, "YouTube");
    return (await res.json()) as T;
  };

  // Call 1: playlist name. Private playlists come back as an empty list for API-key requests.
  const meta = await call<PlaylistsResponse>("playlists", {
    part: "snippet",
    id: listId,
    fields: "items(snippet/title)",
  });
  const info = meta.items?.[0];
  if (!info) {
    throw new AppError("private_playlist", "That playlist is private or doesn't exist. Make it Public/Unlisted, or paste your songs.", 404, "YouTube");
  }

  // Calls 2-3: up to 100 items.
  const tracks: Track[] = [];
  let pageToken: string | undefined;
  do {
    const page: ItemsResponse = await call<ItemsResponse>("playlistItems", {
      part: "snippet",
      playlistId: listId,
      maxResults: "50",
      fields: "nextPageToken,items(snippet(title,videoOwnerChannelTitle))",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of page.items ?? []) {
      const title = item.snippet?.title ?? "";
      const channel = item.snippet?.videoOwnerChannelTitle ?? "";
      if (!title || /^(deleted|private) video$/i.test(title)) continue;
      tracks.push(cleanYoutubeTitle(title, channel));
    }
    pageToken = page.nextPageToken;
  } while (pageToken && calls < MAX_YT_CALLS);

  return {
    source: "youtube",
    playlistName: truncate(info.snippet?.title ?? "Untitled playlist", LIMITS.playlistNameMaxChars),
    tracks,
  };
}
