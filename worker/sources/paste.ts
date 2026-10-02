// "Paste your songs" mode: the universal fallback for any platform.

import { AppError } from "../errors";
import { LIMITS, type Playlist, type Track } from "../../shared/types";

export function parsePastedSongs(text: string): Playlist {
  if (text.length > LIMITS.pasteMaxChars) {
    throw new AppError("too_long", `That's a lot of songs. Keep it under ${LIMITS.pasteMaxChars.toLocaleString()} characters.`);
  }
  const lines = text.split(/\r?\n/);
  if (lines.filter((l) => l.trim()).length > LIMITS.pasteMaxLines) {
    throw new AppError("too_long", `Max ${LIMITS.pasteMaxLines} songs, one per line. We're roasting, not auditing.`);
  }

  const tracks: Track[] = [];
  for (const raw of lines) {
    const line = raw
      .replace(/^\s*(?:\d{1,3}\s*[.)\]:-]|[-*•·▪►]|\d{1,3}\s+(?=\D))\s*/, "") // "1. ", "- ", "• "
      .replace(/\s*\(?\b\d{1,2}:\d{2}(?::\d{2})?\)?\s*$/, "") // trailing durations "3:45"
      .trim();
    if (!line || /^https?:\/\//i.test(line)) continue;

    const byMatch = /^(.+?)\s+by\s+(.+)$/i.exec(line);
    const dashMatch = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
    if (byMatch) tracks.push({ title: byMatch[1], artist: byMatch[2] });
    else if (dashMatch) tracks.push({ title: dashMatch[1], artist: dashMatch[2] });
    else tracks.push({ title: line, artist: "Unknown" });
  }
  return { source: "paste", playlistName: "Pasted playlist", tracks };
}
