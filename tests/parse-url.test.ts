import { describe, expect, it } from "vitest";
import { parsePlaylistLink } from "../shared/parse-url";

const LIST = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG";

describe("parsePlaylistLink", () => {
  it.each([
    `https://www.youtube.com/playlist?list=${LIST}`,
    `https://youtube.com/playlist?list=${LIST}&si=abc123`,
    `https://music.youtube.com/playlist?list=${LIST}&feature=share`,
    `https://m.youtube.com/playlist?list=${LIST}`,
    `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${LIST}&index=3`,
    `https://youtu.be/dQw4w9WgXcQ?list=${LIST}`,
    `youtube.com/playlist?list=${LIST}`,
    `  https://music.youtube.com/playlist?list=${LIST}  `,
  ])("YouTube: %s", (url) => {
    expect(parsePlaylistLink(url)).toEqual({ platform: "youtube", listId: LIST });
  });

  it("rejects YouTube links without a list id", () => {
    expect(parsePlaylistLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({ platform: "invalid" });
    expect(parsePlaylistLink("https://www.youtube.com/playlist?list=<script>")).toEqual({ platform: "invalid" });
  });

  it.each([
    ["https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz", "37i9dQZF1DXcBWIGoYBM5M"],
    ["https://open.spotify.com/intl-en/playlist/37i9dQZF1DXcBWIGoYBM5M", "37i9dQZF1DXcBWIGoYBM5M"],
    ["spotify:playlist:37i9dQZF1DXcBWIGoYBM5M", "37i9dQZF1DXcBWIGoYBM5M"],
  ])("Spotify: %s", (url, id) => {
    expect(parsePlaylistLink(url)).toEqual({ platform: "spotify", playlistId: id });
  });

  it("Spotify short links keep a sanitised URL to resolve", () => {
    expect(parsePlaylistLink("https://spotify.link/AbCdEf?x=1")).toEqual({ platform: "spotify", playlistId: null, shortUrl: "https://spotify.link/AbCdEf" });
  });

  it("Apple Music: rebuilds a safe URL", () => {
    expect(parsePlaylistLink("https://music.apple.com/in/playlist/bollywood-hits/pl.d60caf0c3b4c4bd1b2d2a6b5e1d0c3a1?l=en")).toEqual({
      platform: "apple",
      url: "https://music.apple.com/in/playlist/bollywood-hits/pl.d60caf0c3b4c4bd1b2d2a6b5e1d0c3a1",
    });
    expect(parsePlaylistLink("https://music.apple.com/in/album/foo/123")).toEqual({ platform: "invalid" });
  });

  it.each([
    ["https://www.jiosaavn.com/featured/x/abc", "JioSaavn"],
    ["https://gaana.com/playlist/x", "Gaana"],
    ["https://soundcloud.com/a/sets/b", "SoundCloud"],
  ])("unsupported: %s", (url, name) => {
    expect(parsePlaylistLink(url)).toEqual({ platform: "unsupported", name });
  });

  it.each([
    ["https://music.amazon.in/playlists/B07646V4CG?ref=dm_sh_x", "https://music.amazon.in/embed/B07646V4CG/"],
    ["https://music.amazon.com/user-playlists/e28b0c914d8f411e9273fb59574f166bi8n0", "https://music.amazon.com/embed/e28b0c914d8f411e9273fb59574f166bi8n0/"],
    ["music.amazon.co.uk/playlists/B08MVBFYTC/", "https://music.amazon.co.uk/embed/B08MVBFYTC/"],
    ["https://music.amazon.in/albums/B07T4P3H63", null],
  ])("Amazon Music: %s", (url, embedUrl) => {
    expect(parsePlaylistLink(url)).toEqual({ platform: "amazon", embedUrl });
  });

  it("Amazon short links and non-music Amazon pages", () => {
    expect(parsePlaylistLink("https://amzn.in/d/abc123")).toEqual({ platform: "amazon", embedUrl: null, shortUrl: "https://amzn.in/d/abc123" });
    expect(parsePlaylistLink("https://www.amazon.in/dp/B0XYZ")).toEqual({ platform: "unsupported", name: "Amazon" });
  });

  it.each(["", "not a url", "javascript:alert(1)", "ftp://x.com/a", "localhost"])("invalid: %s", (s) => {
    expect(parsePlaylistLink(s).platform).toBe("invalid");
  });
});
