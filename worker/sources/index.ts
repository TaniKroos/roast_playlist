import { AppError } from "../errors";
import { parsePlaylistLink } from "../../shared/parse-url";
import { fetchYoutubePlaylist } from "./youtube";
import { fetchApplePlaylist } from "./apple";
import { parsePastedSongs } from "./paste";
import { LIMITS, type InputMode, type Playlist } from "../../shared/types";

export interface SourceEnv {
  YOUTUBE_API_KEY?: string;
}

export async function loadPlaylist(mode: InputMode, input: string, env: SourceEnv, fetchImpl: typeof fetch = fetch): Promise<Playlist> {
  if (mode === "paste") return parsePastedSongs(input);

  if (input.length > LIMITS.urlMaxChars) throw new AppError("too_long", "That link is suspiciously long. Paste the playlist link only.");
  const link = parsePlaylistLink(input);
  switch (link.platform) {
    case "youtube":
      return fetchYoutubePlaylist(link.listId, env.YOUTUBE_API_KEY, fetchImpl);
    case "apple":
      return fetchApplePlaylist(link.url, fetchImpl);
    case "spotify":
      // Since Feb 2026 Spotify only returns playlist items to the playlist's owner/collaborators,
      // and Client Credentials is being phased out for metadata. No login allowed → paste mode.
      throw new AppError(
        "spotify_unsupported",
        "Spotify locked its playlists behind a login in 2026, and we don't do logins. Paste your songs instead.",
        422,
        "Spotify",
      );
    case "unsupported":
      throw new AppError("unsupported_platform", `We can't read ${link.name} links (yet). Paste your songs and we'll roast them anyway.`, 422, link.name);
    case "invalid":
      throw new AppError("invalid_link", "That doesn't look like a playlist link. Try a YouTube, YouTube Music or Apple Music playlist URL.");
  }
}
