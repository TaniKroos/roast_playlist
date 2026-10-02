import type { ErrorCode } from "../../shared/types";
import { RedoIcon } from "./Icons";

const TITLES: Partial<Record<ErrorCode, [string, string]>> = {
  private_playlist: ["🔒", "That playlist is hiding."],
  unsupported_platform: ["🤷", "Can't read that one."],
  invalid_link: ["🧐", "That's not a playlist link."],
  empty_playlist: ["🦗", "It's… empty."],
  rate_limited: ["🧯", "Slow down, DJ."],
  exhausted: ["😮‍💨", "Roaster is exhausted."],
  roaster_choked: ["🤢", "The roaster choked."],
  captcha_failed: ["🤖", "Are you a robot?"],
  too_long: ["📜", "That's a novel."],
  source_unavailable: ["📡", "Couldn't fetch it."],
};

const PASTE_WAY_OUT: ErrorCode[] = ["private_playlist", "unsupported_platform", "invalid_link", "source_unavailable", "empty_playlist"];
const RETRYABLE: ErrorCode[] = ["roaster_choked", "rate_limited", "captcha_failed", "source_unavailable"];

interface Props {
  code: ErrorCode;
  message: string;
  onPaste: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorView({ code, message, onPaste, onRetry, onBack }: Props) {
  const [emoji, title] = TITLES[code] ?? ["😵", "Something broke."];
  return (
    <section className="error" role="alert">
      <span className="emoji" aria-hidden>
        {emoji}
      </span>
      <h2>{title}</h2>
      <p>{message}</p>

      {code === "private_playlist" && (
        <div className="howto">
          <b>Make it visible:</b> on <b>YouTube</b>, playlist → ⋮ → Privacy → <b>Public</b> or <b>Unlisted</b>. On <b>Spotify</b>, playlist → ⋯ →
          <b>Add to profile</b> / make it public. Personal mixes (Liked Songs, "My Mix") can't be read. Paste those songs instead.
        </div>
      )}

      <div className="btns">
        {PASTE_WAY_OUT.includes(code) && (
          <button className="btn primary" onClick={onPaste}>
            Paste my songs instead
          </button>
        )}
        {RETRYABLE.includes(code) && (
          <button className="btn primary" onClick={onRetry}>
            <RedoIcon /> Try again
          </button>
        )}
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
      </div>
    </section>
  );
}
