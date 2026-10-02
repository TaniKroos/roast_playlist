import { describe, expect, it } from "vitest";
import { computeStats, primaryArtist, sampleTracks, truncate } from "../worker/playlist-utils";

const make = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Song ${i}`, artist: `Artist ${i % 7}` }));

describe("sampleTracks", () => {
  it("returns small playlists unchanged", () => {
    expect(sampleTracks(make(10))).toHaveLength(10);
  });

  it("samples first 20, 30 middle (in order), last 10", () => {
    const out = sampleTracks(make(200), 60, () => 0.5);
    expect(out).toHaveLength(60);
    expect(out.slice(0, 20).map((t) => t.title)).toEqual(make(20).map((t) => t.title));
    expect(out.slice(-10).map((t) => t.title)).toEqual(make(200).slice(-10).map((t) => t.title));
    const middle = out.slice(20, 50).map((t) => Number(t.title.split(" ")[1]));
    expect(middle.every((n) => n >= 20 && n < 190)).toBe(true);
    expect([...middle].sort((a, b) => a - b)).toEqual(middle);
    expect(new Set(middle).size).toBe(30);
  });

  it("truncates long fields to 60 chars", () => {
    const out = sampleTracks([{ title: "x".repeat(100), artist: "y".repeat(100) }]);
    expect(out[0].title.length).toBe(60);
    expect(out[0].artist.length).toBe(60);
  });

  it("truncate strips control characters", () => {
    expect(truncate("a\u0000b\nc", 10)).toBe("a b c");
  });
});

describe("computeStats", () => {
  it("counts primary artists", () => {
    const tracks = [
      { title: "a", artist: "Arijit Singh" },
      { title: "b", artist: "Arijit Singh, Pritam" },
      { title: "c", artist: "arijit singh & Shreya Ghoshal" },
      { title: "d", artist: "AP Dhillon feat. Gurinder Gill" },
      { title: "e", artist: "Unknown" },
    ];
    const s = computeStats(tracks);
    expect(s.trackCount).toBe(5);
    expect(s.topArtists[0]).toEqual({ artist: "Arijit Singh", count: 3 });
    expect(s.topArtistShare).toBe(60);
    expect(s.uniqueArtists).toBe(2);
  });

  it("limits top artists to 5 and handles empty input", () => {
    expect(computeStats(make(70)).topArtists).toHaveLength(5);
    expect(computeStats([])).toEqual({ trackCount: 0, topArtists: [], topArtistShare: 0, uniqueArtists: 0 });
  });

  it("primaryArtist splits collaborations", () => {
    expect(primaryArtist("Drake x 21 Savage")).toBe("Drake");
    expect(primaryArtist("Badshah ft. Aastha Gill")).toBe("Badshah");
  });
});

import { parsePastedSongs } from "../worker/sources/paste";

describe("parsePastedSongs", () => {
  it.each([
    ["295 - Sidhu Moose Wala", "295", "Sidhu Moose Wala"],
    ["22 - Taylor Swift", "22", "Taylor Swift"],
    ["1. Tum Hi Ho - Arijit Singh", "Tum Hi Ho", "Arijit Singh"],
    ["3 - Kesariya - Arijit Singh", "Kesariya", "Arijit Singh"],
    ["12) Softly - Karan Aujla 3:45", "Softly", "Karan Aujla"],
    ["• Brown Munde by AP Dhillon", "Brown Munde", "AP Dhillon"],
    ["- Husn - Anuv Jain", "Husn", "Anuv Jain"],
    ["Satranga", "Satranga", "Unknown"],
  ])("%s", (line, title, artist) => {
    expect(parsePastedSongs(line).tracks[0]).toEqual({ title, artist });
  });

  it("skips blank lines and URLs", () => {
    expect(parsePastedSongs("\nhttps://open.spotify.com/track/x\n\nA - B\n").tracks).toEqual([{ title: "A", artist: "B" }]);
  });
});
