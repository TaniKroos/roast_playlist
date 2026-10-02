// Types shared by the frontend and the Worker.

export type Source = "youtube" | "spotify" | "apple" | "paste";
export type Language = "english" | "hinglish";
export type InputMode = "link" | "paste";

export interface Track {
  title: string;
  artist: string;
}

/** The normalised shape every source produces. This is the only thing sent to the LLM. */
export interface Playlist {
  source: Source;
  playlistName: string;
  tracks: Track[];
}

export interface PlaylistStats {
  /** Tracks we read from the source, before sampling. */
  trackCount: number;
  topArtists: { artist: string; count: number }[];
  /** % of tracks by the single most repeated artist (0-100). */
  topArtistShare: number;
  uniqueArtists: number;
}

export interface Roast {
  verdict: string;
  tasteLabel: string;
  roastLines: string[];
  basicScore: number;
  redemption: string;
}

export interface RoastRequest {
  mode: InputMode;
  input: string;
  language: Language;
  turnstileToken: string;
}

export type ErrorCode =
  | "bad_request"
  | "invalid_link"
  | "unsupported_platform"
  | "spotify_unsupported"
  | "private_playlist"
  | "empty_playlist"
  | "source_unavailable"
  | "too_long"
  | "captcha_failed"
  | "rate_limited"
  | "exhausted"
  | "roaster_choked";

export interface RoastMeta {
  source: Source;
  playlistName: string;
  stats: PlaylistStats;
}

export type RoastResponse =
  | { ok: true; roast: Roast; meta: RoastMeta }
  | { ok: false; code: ErrorCode; message: string; platform?: string };

export interface PublicConfig {
  turnstileSiteKey: string;
}

export const LIMITS = {
  urlMaxChars: 300,
  pasteMaxLines: 100,
  pasteMaxChars: 6000,
  trackCap: 60,
  fieldMaxChars: 60,
  playlistNameMaxChars: 80,
} as const;
