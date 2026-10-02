import type { Language } from "../../shared/types";

export const LOADING_LINES: Record<Language, string[]> = {
  english: [
    "Judging your Honey Singh phase...",
    "Counting how many times Arijit made you cry...",
    "Calling your 2016 self for a statement...",
    "Asking the aux cord if it's okay...",
    "Measuring the slowed + reverb levels...",
    "Cross-checking with your ex's playlist...",
    "Detecting gym-bro energy...",
    "Pretending to listen to the whole thing...",
    "Consulting a panel of disappointed DJs...",
    "Sharpening the knives...",
  ],
  hinglish: [
    "Tera Honey Singh phase judge ho raha hai...",
    "Ginti chal rahi hai, Arijit ne kitni baar rulaaya...",
    "Mummy ko bata rahe hain tu kya sunta hai...",
    "Aux cord se maafi maang rahe hain...",
    "Slowed + reverb ka level check ho raha hai...",
    "Gym wali Punjabi energy detect ho rahi hai...",
    "DJ wale babu bhi sharma gaye...",
    "Roast ka masala pees rahe hain...",
    "Thoda ruk, abhi toh bas shuru hua hai...",
    "Teri playlist pe meeting chal rahi hai...",
  ],
};

export const MARQUEE: string[] = [
  "58% Arijit Singh. Bro is not okay.",
  "Your gym playlist is just Sidhu on loop and a protein shake.",
  "Bhai ne 2014 ke remix abhi tak delete nahi kiye.",
  "Taylor Swift has paid fewer rent cheques than your replay button.",
  "Lofi beats to avoid your responsibilities to.",
  "Yeh playlist nahi, Ola auto ka aux hai.",
  "Every song is either a breakup or a Bugatti.",
  "Coldplay tickets didn't work out, so this is the coping mechanism.",
];

export const SAMPLES: { label: string; emoji: string; songs: string }[] = [
  {
    label: "Heartbreak Bollywood",
    emoji: "💔",
    songs: `Tum Hi Ho - Arijit Singh
Channa Mereya - Arijit Singh
Agar Tum Saath Ho - Arijit Singh
Phir Bhi Tumko Chaahunga - Arijit Singh
Hamari Adhuri Kahani - Arijit Singh
Tujhe Kitna Chahne Lage - Arijit Singh
Kabira - Arijit Singh
Tera Ban Jaunga - Akhil Sachdeva
Bekhayali - Sachet Tandon
Kesariya - Arijit Singh
Main Dhoondne Ko Zamaane Mein - Arijit Singh
Tadap Tadap - KK
Satranga - Arijit Singh
Apna Bana Le - Arijit Singh`,
  },
  {
    label: "Punjabi gym-bro",
    emoji: "💪",
    songs: `Brown Munde - AP Dhillon
Excuses - AP Dhillon
295 - Sidhu Moose Wala
So High - Sidhu Moose Wala
Softly - Karan Aujla
Tauba Tauba - Karan Aujla
Lover - Diljit Dosanjh
G.O.A.T. - Diljit Dosanjh
Elevated - Shubh
Still Rollin - Shubh
With You - AP Dhillon
Insane - AP Dhillon
Admirin' You - Karan Aujla
Born To Shine - Diljit Dosanjh`,
  },
  {
    label: "Swiftie in crisis",
    emoji: "🧣",
    songs: `All Too Well (10 Minute Version) - Taylor Swift
cardigan - Taylor Swift
drivers license - Olivia Rodrigo
vampire - Olivia Rodrigo
Anti-Hero - Taylor Swift
Espresso - Sabrina Carpenter
I Love You, I'm Sorry - Gracie Abrams
the 1 - Taylor Swift
Cruel Summer - Taylor Swift
traitor - Olivia Rodrigo
Heather - Conan Gray
champagne problems - Taylor Swift`,
  },
  {
    label: "2014 party remix",
    emoji: "🪩",
    songs: `Blue Eyes - Yo Yo Honey Singh
Lungi Dance - Yo Yo Honey Singh
DJ Waley Babu - Badshah
Abhi Toh Party Shuru Hui Hai - Badshah
Sunny Sunny - Yo Yo Honey Singh
Kala Chashma - Badshah
Saturday Saturday - Badshah
Proper Patola - Diljit Dosanjh & Badshah
Chaar Bottle Vodka - Yo Yo Honey Singh
Garmi - Badshah
Lat Lag Gayee - Benny Dayal
Baby Ko Bass Pasand Hai - Vishal Dadlani`,
  },
];

export function basicTier(score: number): string {
  if (score <= 20) return "Underground goblin";
  if (score <= 40) return "Mildly cultured";
  if (score <= 60) return "The algorithm's favourite pet";
  if (score <= 80) return "Certified basic";
  return "Pumpkin spice latte in audio form";
}

export const SOURCE_NAMES = { youtube: "YouTube", spotify: "Spotify", apple: "Apple Music", amazon: "Amazon Music", paste: "Pasted songs" } as const;
