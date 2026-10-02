import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { Roast, RoastMeta } from "../../shared/types";
import { SOURCE_NAMES, basicTier } from "../lib/content";
import { canvasToBlob, downloadBlob, renderShareCard } from "../lib/shareCard";
import { DownloadIcon, RedoIcon, ShareIcon } from "./Icons";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Types roast lines one after another. */
function useTypewriter(lines: string[], startDelay: number) {
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [finished, setFinished] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    if (reduceMotion()) {
      setDone(lines);
      setFinished(true);
      return;
    }
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await sleep(startDelay);
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        for (let c = 1; c <= line.length; c++) {
          if (cancelled) return;
          if (skipRef.current) {
            setDone(lines);
            setCurrent("");
            setFinished(true);
            return;
          }
          setCurrent(line.slice(0, c));
          await sleep(/[.,!?—]/.test(line[c - 1]) ? 70 : 9 + Math.random() * 9);
        }
        if (cancelled) return;
        setDone((d) => [...d, line]);
        setCurrent("");
        await sleep(260);
      }
      setFinished(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [lines, startDelay]);

  return { done, current, finished, skip: () => (skipRef.current = true) };
}

function useCountUp(target: number, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduceMotion()) return setN(target);
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

interface Props {
  roast: Roast;
  meta: RoastMeta;
  onAgain: () => void;
  onRetry: () => void;
  toast: (msg: string) => void;
}

export function Result({ roast, meta, onAgain, onRetry, toast }: Props) {
  const words = roast.verdict.split(" ");
  const tw = useTypewriter(roast.roastLines, 700 + words.length * 60);
  const score = useCountUp(roast.basicScore, tw.finished);
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);
  const [sharing, setSharing] = useState(false);
  const top = meta.stats.topArtists;
  const maxCount = top[0]?.count ?? 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!tw.finished) return;
    let url = "";
    renderShareCard(roast, meta, window.location.host)
      .then(canvasToBlob)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setCard({ url, blob });
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [tw.finished, roast, meta]);

  const filename = "taste-kharab-roast.png";
  const download = useCallback(() => {
    if (!card) return;
    downloadBlob(card.blob, filename);
    toast("Saved. Now post it before you chicken out.");
  }, [card, toast]);

  const share = useCallback(async () => {
    if (!card) return;
    const file = new File([card.blob], filename, { type: "image/png" });
    const data: ShareData = { files: [file], title: "My playlist got roasted 🔥", text: `${roast.verdict} — get roasted at ${window.location.origin}` };
    if (navigator.canShare?.(data)) {
      setSharing(true);
      try {
        await navigator.share(data);
      } catch (e) {
        if ((e as Error).name !== "AbortError") download();
      } finally {
        setSharing(false);
      }
    } else {
      download();
    }
  }, [card, roast.verdict, download]);

  return (
    <section className="result">
      <div className="result-head">
        <span className="src">
          {SOURCE_NAMES[meta.source]} {meta.source !== "paste" && <em>“{meta.playlistName}”</em>}
        </span>
        <span>{meta.stats.trackCount} tracks judged</span>
      </div>

      <div className="sticker">{roast.tasteLabel}</div>
      <h1 className="verdict" aria-label={roast.verdict}>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="w" style={{ animationDelay: `${0.25 + i * 0.06}s` }} aria-hidden>
              {w}
            </span>{" "}
          </Fragment>
        ))}
      </h1>

      <ol className="burns" aria-live="polite">
        {tw.done.map((l, i) => (
          <li key={i} className="burn">
            <span className="idx">{String(i + 1).padStart(2, "0")}</span>
            <span className="txt">{l}</span>
          </li>
        ))}
        {tw.current && (
          <li className="burn typing" aria-hidden>
            <span className="idx">{String(tw.done.length + 1).padStart(2, "0")}</span>
            <span className="txt">{tw.current}</span>
          </li>
        )}
      </ol>
      {!tw.finished && (
        <button className="skip" onClick={tw.skip}>
          skip animation ↓
        </button>
      )}

      {tw.finished && (
        <>
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={roast.basicScore} aria-label="Basic score">
            <div className="meter-top">
              <div>
                <div className="lbl">Basic-o-meter</div>
                <div className="tier">{basicTier(roast.basicScore)}</div>
              </div>
              <div className="meter-num">
                {score}
                <small>/100</small>
              </div>
            </div>
            <div className="bars" aria-hidden>
              {Array.from({ length: 20 }, (_, i) => {
                const on = i < Math.round((score / 100) * 20);
                return <i key={i} className={on ? `on${i >= 16 ? " hot" : ""}` : undefined} />;
              })}
            </div>
            <div className="scale" aria-hidden>
              <span>underground</span>
              <span>mid</span>
              <span>basic af</span>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="v">{meta.stats.trackCount}</div>
              <div className="k">tracks</div>
            </div>
            <div className="stat">
              <div className="v">{meta.stats.uniqueArtists}</div>
              <div className="k">artists</div>
            </div>
            <div className="stat">
              <div className="v">{meta.stats.topArtistShare}%</div>
              <div className="k">one artist</div>
            </div>
            {top.length > 0 && (
              <div className="stat wide">
                <div className="k">Repeat offenders</div>
                <div className="artist-bars">
                  {top.map((a, i) => (
                    <div key={a.artist} style={{ ["--w" as string]: `${Math.max(12, (a.count / maxCount) * 100)}%`, animationDelay: `${i * 0.1}s` }}>
                      <span>{a.artist}</span>
                      <em>×{a.count}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="redemption">
            <span className="k">Okay, one nice thing</span>
            {roast.redemption}
          </p>

          <div className="share">
            <div className="preview">{card ? <img src={card.url} alt="Your roast card preview" /> : <div className="shimmer" />}</div>
            <div>
              <h3>Post your shame.</h3>
              <p>A story-sized card, made right here on your phone. It never touches our servers.</p>
              <div className="btns">
                <button className="btn primary" onClick={share} disabled={!card || sharing}>
                  <ShareIcon /> Share
                </button>
                <button className="btn" onClick={download} disabled={!card}>
                  <DownloadIcon /> Download
                </button>
              </div>
            </div>
          </div>

          <div className="again">
            <button className="btn light" onClick={onAgain}>
              🔥 Roast another
            </button>
            <button className="btn" onClick={onRetry}>
              <RedoIcon /> Re-roast this one
            </button>
          </div>
        </>
      )}
    </section>
  );
}
