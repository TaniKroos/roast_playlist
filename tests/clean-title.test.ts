import { describe, expect, it } from "vitest";
import { cleanYoutubeTitle } from "../worker/clean-title";

describe("cleanYoutubeTitle", () => {
  it.each([
    ["Kesariya - Brahmāstra | Ranbir Kapoor | Alia Bhatt | Pritam | Arijit Singh | Amitabh B", "T-Series", "Kesariya - Brahmāstra", "T-Series"],
    ["The Weeknd - Blinding Lights (Official Video)", "TheWeekndVEVO", "Blinding Lights", "The Weeknd"],
    ["Brown Munde (Official Video) AP Dhillon | Gurinder Gill | Shinda Kahlon", "AP Dhillon", "Brown Munde", "AP Dhillon"],
    ["Tum Hi Ho", "Arijit Singh - Topic", "Tum Hi Ho", "Arijit Singh"],
    ["Ed Sheeran - Shape of You [Official Lyric Video] 4K", "Ed Sheeran", "Shape of You", "Ed Sheeran"],
    ["Full Video: Chaiyya Chaiyya | Dil Se | Shah Rukh Khan", "Sony Music India", "Chaiyya Chaiyya", "Sony Music India"],
    ["Blue Eyes Full Video Song Yo Yo Honey Singh | Blockbuster Song Of 2013", "T-Series", "Blue Eyes Full Video Song Yo Yo Honey Singh", "T-Series"],
    ["Daylight (Lyrics) #shorts", "David Kushner", "Daylight", "David Kushner"],
    ["Levitating (Remix) - Dua Lipa HD", "Dua Lipa", "Levitating (Remix)", "Dua Lipa"],
  ])("%s", (raw, channel, title, artist) => {
    const out = cleanYoutubeTitle(raw, channel);
    expect(out.title).toBe(title);
    expect(out.artist).toBe(artist);
  });

  it("never returns an empty title", () => {
    expect(cleanYoutubeTitle("(Official Video)", "X").title).toBe("(Official Video)");
  });
});
