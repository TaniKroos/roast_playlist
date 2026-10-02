import { FlameLogo, LockIcon } from "./Icons";

export function Topbar({ onHome, onPrivacy }: { onHome: () => void; onPrivacy: () => void }) {
  return (
    <header className="wrap topbar">
      <a
        className="brand"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        <FlameLogo />
        <span>
          Taste <b>Kharab</b>
        </span>
      </a>
      <nav>
        <a
          href="/privacy"
          onClick={(e) => {
            e.preventDefault();
            onPrivacy();
          }}
        >
          Privacy
        </a>
      </nav>
    </header>
  );
}

export function Footer({ onPrivacy }: { onPrivacy: () => void }) {
  return (
    <footer>
      <div className="wrap">
        <span className="lock">
          <LockIcon /> We don't store your playlist or your roast. Ever.
        </span>
        <a
          href="/privacy"
          onClick={(e) => {
            e.preventDefault();
            onPrivacy();
          }}
        >
          How we keep it private →
        </a>
      </div>
    </footer>
  );
}
