// Turns messy YouTube video titles into { title, artist }.

import type { Track } from "../shared/types";

const NOISE =
  /\b(official|video|audio|lyrics?|lyrical|visuali[sz]er|4k|8k|hd|hq|full\s+song|video\s+song|audio\s+song|music\s+video|mv|m\/v|explicit|clean|remaster(ed)?(\s+\d{4})?|color\s+coded|with\s+lyrics|1080p|720p|dolby|360°?|new\s+song|latest|trending|full\s+video|full\s+audio|out\s+now|premiere)\b/i;

// Labels whose channel name is not the performing artist.
const LABELS =
  /^(t-series|sony music( india| south)?|zee music company|saregama( music| hum bhi)?|tips (official|music|industries)|yrf|speed records|white hill music|desi melodies|times music|venus|eros now music|shemaroo|aditya music|lahari music|think music india|vevo|believe|geet mp3|jjust music|playdmf|mass appeal india|universal music india|warner music india|ultra records|wm india)$/i;

export function cleanYoutubeTitle(rawTitle: string, channel: string): Track {
  const channelName = channel.replace(/\s*-\s*Topic$/i, "").replace(/VEVO$/i, "").trim();
  const isTopicChannel = /\s-\s*Topic$/i.test(channel);

  let title = rawTitle
    .replace(/#\S+/g, " ") // hashtags
    .replace(/[([【「][^)\]】」]*[)\]】」]/g, (seg) => (NOISE.test(seg) ? " " : seg)); // noisy brackets only

  // "Song - Movie | Actor | Actor | Composer" → keep the first pipe segment
  title = title.split(/\s[|｜]\s?|\s?[|｜]\s/)[0];

  // Leading/trailing noise like "Full Video:", "Lyrical:", "- Official Video"
  title = title
    .replace(/^\s*(full\s+video|lyrical|video|audio|official\s+video)\s*[:\-–]\s*/i, "")
    .replace(/\s*[-–:]\s*(official\s+)?(music\s+)?(lyric(al)?\s+)?(video|audio|visuali[sz]er)(\s+song)?\s*$/i, "")
    .replace(/\s*\b(4k|hd|hq|1080p|full\s+song|video\s+song|audio\s+song|lyrical)\b\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-–:|,\s]+|[-–:|,\s]+$/g, "");

  let artist = channelName;
  const dash = /^(.+?)\s+[-–—]\s+(.+)$/.exec(title);
  if (isTopicChannel) {
    // Auto-generated "Artist - Topic" channels: title is the bare song name.
    artist = channelName;
  } else if (dash) {
    const [, left, right] = dash;
    const matchesChannel = (s: string) =>
      !!channelName && (s.toLowerCase().includes(channelName.toLowerCase()) || channelName.toLowerCase().includes(s.toLowerCase()));
    if (matchesChannel(right) && !matchesChannel(left)) {
      // "Song - Artist"
      artist = right.trim();
      title = left.trim();
    } else if (matchesChannel(left) || !LABELS.test(channelName)) {
      // Western convention "Artist - Song"
      artist = left.trim();
      title = right.trim();
    }
    // Indian label convention "Song - Movie" by T-Series: keep title whole, artist = label
  } else if (channelName && title.toLowerCase().endsWith(" " + channelName.toLowerCase())) {
    // "Brown Munde AP Dhillon" → "Brown Munde"
    title = title.slice(0, -channelName.length).trim();
  }

  return {
    title: title || rawTitle.trim(),
    artist: artist || "Unknown",
  };
}
