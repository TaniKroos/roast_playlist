import { useEffect, useMemo, useRef, type FormEvent, type ReactNode } from "react";
import { parsePlaylistLink } from "../../shared/parse-url";
import { LIMITS, type InputMode, type Language } from "../../shared/types";
import { MARQUEE, SAMPLES } from "../lib/content";
import { AppleMusicIcon, LinkIcon, ListIcon, SpotifyIcon, WarnIcon, YouTubeIcon } from "./Icons";

export interface FormState {
  mode: InputMode;
  link: string;
  songs: string;
  language: Language;
}

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
}

type Detection = { tone: "good" | "warn" | "bad"; icon: ReactNode; label: string; hint?: string } | null;

function detect(link: string): Detection {
  if (!link.trim()) return null;
  const info = parsePlaylistLink(link);
  switch (info.platform) {
    case "youtube":
      return { tone: "good", icon: <YouTubeIcon />, label: "YouTube", hint: "Nice. Public or unlisted playlists only." };
    case "apple":
      return { tone: "good", icon: <AppleMusicIcon />, label: "Apple Music", hint: "Public Apple Music playlist. Best effort, fingers crossed." };
    case "spotify":
      return info.playlistId || info.shortUrl
        ? { tone: "good", icon: <SpotifyIcon />, label: "Spotify", hint: "Public Spotify playlist. We read up to 100 tracks." }
        : { tone: "bad", icon: <SpotifyIcon />, label: "Spotify", hint: "That's a Spotify link, but not a playlist. Share the playlist itself." };
    case "unsupported":
      return { tone: "warn", icon: <WarnIcon />, label: info.name.length > 14 ? "Unsupported" : info.name, hint: `${info.name} links aren't supported. Paste your songs instead.` };
    case "invalid":
      return link.trim().length > 8 ? { tone: "bad", icon: <WarnIcon />, label: "Hmm", hint: "That doesn't look like a playlist link yet." } : null;
  }
}

export function Home({ form, setForm, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const detection = useMemo(() => (form.mode === "link" ? detect(form.link) : null), [form.mode, form.link]);
  const songLines = form.songs.split(/\r?\n/).filter((l) => l.trim()).length;
  const tooLong = form.mode === "paste" ? songLines > LIMITS.pasteMaxLines || form.songs.length > LIMITS.pasteMaxChars : form.link.length > LIMITS.urlMaxChars;
  const switchToPaste = detection?.tone === "warn";
  const canSubmit = !tooLong && (form.mode === "paste" ? songLines > 0 : detection?.tone === "good" || detection?.tone === "warn");

  useEffect(() => {
    (form.mode === "link" ? inputRef : areaRef).current?.focus({ preventScroll: true });
  }, [form.mode]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setForm({ ...form, link: text.trim().slice(0, LIMITS.urlMaxChars + 20) });
    } catch {
      inputRef.current?.focus();
    }
  };

  const modeIdx = form.mode === "link" ? 0 : 1;
  const langIdx = form.language === "english" ? 0 : 1;

  return (
    <>
      <section className="hero">
        <div className="kicker">
          <span>No login</span>
          <span>Nothing stored</span>
          <span>~10 seconds</span>
        </div>
        <h1>
          <span className="line">
            <span>Your playlist</span>
          </span>
          <span className="line">
            <span>is about to</span>
          </span>
          <span className="line">
            <span>
              get{" "}
              <span className="cooked">
                <span className="flick">cooked.</span>
              </span>
            </span>
          </span>
        </h1>
        <p className="lede">
          Drop a playlist link or paste your songs. Get a <strong>brutally specific roast</strong> of your music taste, in English or
          Hinglish.
        </p>
      </section>

      <form className="card" onSubmit={submit} aria-label="Roast your playlist">
        <div className="seg" role="tablist" aria-label="Input type" data-active={modeIdx}>
          <span className="pill" aria-hidden />
          <button type="button" role="tab" aria-selected={form.mode === "link"} onClick={() => setForm({ ...form, mode: "link" })}>
            <LinkIcon width={16} height={16} /> Playlist link
          </button>
          <button type="button" role="tab" aria-selected={form.mode === "paste"} onClick={() => setForm({ ...form, mode: "paste" })}>
            <ListIcon width={16} height={16} /> Paste songs
          </button>
        </div>

        {form.mode === "link" ? (
          <>
            <div className="field" data-invalid={detection?.tone === "bad"}>
              <label htmlFor="link" className="sr-only">
                Playlist link
              </label>
              <input
                ref={inputRef}
                id="link"
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="youtube.com/playlist?list=…"
                value={form.link}
                maxLength={LIMITS.urlMaxChars + 20}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                aria-describedby="link-hint"
              />
              {detection ? (
                <span key={detection.label} className={`detect ${detection.tone}`}>
                  {detection.icon}
                  {detection.label}
                </span>
              ) : (
                "clipboard" in navigator && (
                  <button type="button" className="paste-btn" onClick={pasteFromClipboard}>
                    Paste
                  </button>
                )
              )}
            </div>
            <div className="hint" id="link-hint" aria-live="polite">
              {detection?.hint ? (
                <span className={detection.tone !== "good" ? "warn" : undefined}>
                  {detection.hint}{" "}
                  {switchToPaste && (
                    <button type="button" className="link" onClick={() => setForm({ ...form, mode: "paste" })}>
                      Paste songs →
                    </button>
                  )}
                </span>
              ) : (
                <span>Spotify, YouTube, YouTube Music &amp; Apple Music links work. Anything else → paste songs.</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="songs" className="sr-only">
                Songs, one per line
              </label>
              <textarea
                ref={areaRef}
                id="songs"
                placeholder={"Tum Hi Ho - Arijit Singh\nBrown Munde - AP Dhillon\nCruel Summer - Taylor Swift\n…one song per line"}
                value={form.songs}
                onChange={(e) => setForm({ ...form, songs: e.target.value })}
                aria-describedby="songs-hint"
              />
            </div>
            <div className="hint" id="songs-hint">
              <span>Works for JioSaavn, Amazon, anything. "Song - Artist" is best.</span>
              <span className={`counter${tooLong ? " over" : ""}`}>
                {songLines}/{LIMITS.pasteMaxLines}
              </span>
            </div>
          </>
        )}

        <div className="row">
          <div className="seg lang" role="radiogroup" aria-label="Roast language" data-active={langIdx}>
            <span className="pill" aria-hidden />
            <button type="button" role="radio" aria-selected={form.language === "english"} aria-checked={form.language === "english"} onClick={() => setForm({ ...form, language: "english" })}>
              English
            </button>
            <button type="button" role="radio" aria-selected={form.language === "hinglish"} aria-checked={form.language === "hinglish"} onClick={() => setForm({ ...form, language: "hinglish" })}>
              Hinglish
            </button>
          </div>
          <button className="cta" type="submit" disabled={!canSubmit}>
            Roast me <span className="fire">🔥</span>
          </button>
        </div>
      </form>

      <div className="samples">
        <p>No playlist handy? Roast a stereotype:</p>
        <div className="chips">
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" className="chip" onClick={() => setForm({ ...form, mode: "paste", songs: s.songs })}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="marquee-item">
              <b>✦</b>
              {m}
            </span>
          ))}
        </div>
      </div>

      <section className="steps" aria-label="How it works">
        <div className="step">
          <span className="n">01</span>
          <h3>Drop it</h3>
          <p>A public Spotify, YouTube or Apple Music playlist, or just type your songs.</p>
        </div>
        <div className="step">
          <span className="n">02</span>
          <h3>Get cooked</h3>
          <p>An AI critic reads your actual artists and repeat habits. Then it gets personal.</p>
        </div>
        <div className="step">
          <span className="n">03</span>
          <h3>Share the shame</h3>
          <p>Download a story-sized card. Made on your phone, never uploaded.</p>
        </div>
      </section>
    </>
  );
}
