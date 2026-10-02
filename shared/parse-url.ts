// Detects which platform a pasted link belongs to and pulls out the playlist id.

export type LinkInfo =
  | { platform: "youtube"; listId: string }
  | { platform: "spotify"; playlistId: string | null }
  | { platform: "apple"; url: string }
  | { platform: "unsupported"; name: string }
  | { platform: "invalid" };

const OTHER_PLATFORMS: [RegExp, string][] = [
  [/(^|\.)jiosaavn\.com$|(^|\.)saavn\.com$/, "JioSaavn"],
  [/(^|\.)music\.amazon\.|(^|\.)amazon\.[a-z.]+$/, "Amazon Music"],
  [/(^|\.)gaana\.com$/, "Gaana"],
  [/(^|\.)wynk\.in$/, "Wynk"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)deezer\.com$|(^|\.)deezer\.page\.link$/, "Deezer"],
  [/(^|\.)tidal\.com$/, "Tidal"],
];

const YT_LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;

export function parsePlaylistLink(raw: string): LinkInfo {
  const input = raw.trim();
  if (!input) return { platform: "invalid" };

  // spotify:playlist:<id> URIs from the desktop app
  const spotifyUri = /^spotify:playlist:([A-Za-z0-9]{10,40})$/.exec(input);
  if (spotifyUri) return { platform: "spotify", playlistId: spotifyUri[1] };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { platform: "invalid" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { platform: "invalid" };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.includes(".")) return { platform: "invalid" };

  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
    const list = url.searchParams.get("list");
    if (!list || !YT_LIST_ID.test(list)) return { platform: "invalid" };
    return { platform: "youtube", listId: list };
  }

  if (host === "open.spotify.com" || host === "play.spotify.com") {
    const m = /\/playlist\/([A-Za-z0-9]{10,40})/.exec(url.pathname);
    return { platform: "spotify", playlistId: m ? m[1] : null };
  }
  if (host === "spotify.link" || host === "spotify.app.link") {
    return { platform: "spotify", playlistId: null };
  }

  if (host === "music.apple.com" || host === "itunes.apple.com") {
    const m = /^\/([a-z]{2})\/playlist\/([^/]+)\/(pl\.[A-Za-z0-9.-]+)\/?$/.exec(url.pathname);
    if (!m) return { platform: "invalid" };
    // Rebuild the URL from validated parts so we only ever fetch music.apple.com.
    return {
      platform: "apple",
      url: `https://music.apple.com/${m[1]}/playlist/${encodeURIComponent(decodeURIComponent(m[2]))}/${m[3]}`,
    };
  }

  for (const [re, name] of OTHER_PLATFORMS) {
    if (re.test(host)) return { platform: "unsupported", name };
  }
  return { platform: "unsupported", name: host };
}
