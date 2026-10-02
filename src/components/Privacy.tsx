export function Privacy({ onBack }: { onBack: () => void }) {
  return (
    <article className="prose">
      <a
        className="back"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onBack();
        }}
      >
        ← back to roasting
      </a>
      <h1>We don't keep your stuff.</h1>
      <p>
        <strong>Short version: no accounts, no database, no logs of what you send.</strong> Your playlist exists on our server only for the
        few seconds it takes to roast it, then it's gone.
      </p>
      <h2>What happens when you hit "Roast me"</h2>
      <ul>
        <li>Your link or song list goes to our server (a Cloudflare Worker) over HTTPS.</li>
        <li>
          If it's a link, we fetch the public track list from YouTube or Apple Music. If it's Spotify, we don't fetch anything. Spotify
          now requires a login, and we don't do logins.
        </li>
        <li>
          We send up to 60 song titles and artists (plus the playlist name) to an AI model to write the roast. Nothing else: no IP, no
          device info, no identifiers.
        </li>
        <li>The roast comes back to your browser. We don't save the link, the songs, or the roast. We don't log request contents either.</li>
      </ul>
      <h2>The share card</h2>
      <p>The image is drawn on your device. It is never uploaded. Download or share it only if you want to.</p>
      <h2>Abuse protection</h2>
      <p>
        We use Cloudflare Turnstile (a privacy-friendly captcha) and short-lived rate limiting (about 5 roasts a minute) to stop bots.
        The rate-limit counter lives at Cloudflare's edge for a minute and isn't stored by us. We keep one anonymous number per day:
        how many paid AI calls were made, so a viral day can't bankrupt us.
      </p>
      <h2>Third parties</h2>
      <p>
        The AI provider that writes your roast processes the song list to generate a response. We only use providers whose API terms say
        API inputs aren't used for training. No ads, no trackers, no analytics cookies.
      </p>
    </article>
  );
}
