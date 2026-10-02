import { useEffect, useState } from "react";
import type { Language } from "../../shared/types";
import { LOADING_LINES } from "../lib/content";

export function Loading({ language }: { language: Language }) {
  const lines = LOADING_LINES[language];
  const [i, setI] = useState(() => Math.floor(Math.random() * lines.length));
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 2100);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <section className="loading" aria-busy="true">
      <div className="pan" aria-hidden>
        <div className="vinyl" />
        <svg className="flames" viewBox="0 0 120 90">
          <defs>
            <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#9db8ff" />
              <stop offset=".6" stopColor="#c3b6ff" />
              <stop offset="1" stopColor="#e6ecff" />
            </linearGradient>
          </defs>
          <path className="f f1" d="M30 88C14 88 8 74 14 60c4-9 12-14 12-28 9 9 12 18 10 28 5-3 7-8 7-14 8 10 9 22 3 32-4 6-9 10-16 10z" fill="url(#fl)" />
          <path className="f f2" d="M60 88c-22 0-30-20-21-38 6-12 18-20 15-46 14 12 22 28 18 44 7-4 10-11 10-19 11 15 12 31 4 44-6 10-14 15-26 15z" fill="url(#fl)" />
          <path className="f f3" d="M92 88c-15 0-21-13-15-25 4-8 11-12 10-26 9 8 12 17 10 26 4-2 6-6 6-11 7 9 8 19 3 27-3 6-8 9-14 9z" fill="url(#fl)" />
          <path className="f core" d="M60 88c-10 0-14-9-9-17 3-5 8-8 7-18 7 6 10 13 8 20 3-1 4-4 4-7 5 6 5 14 1 19-3 2-6 3-11 3z" fill="#f2f5ff" />
        </svg>
      </div>
      <h2>{language === "hinglish" ? "Roast pak raha hai…" : "Cooking your roast…"}</h2>
      <div className="ticker" aria-live="polite">
        <p key={i}>{lines[i]}</p>
      </div>
      <div className="progress" aria-hidden>
        <span />
      </div>
    </section>
  );
}
