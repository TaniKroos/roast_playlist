import { useMemo } from "react";

export function Ambient({ heat }: { heat: boolean }) {
  const embers = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${(i * 53) % 100}%`,
        delay: `${(i * 1.37) % 9}s`,
        dur: `${16 + ((i * 7) % 10)}s`,
        drift: `${((i * 37) % 80) - 40}px`,
        size: 2 + (i % 3),
      })),
    [],
  );
  return (
    <div className={`ambient${heat ? " heat" : ""}`} aria-hidden>
      <div className="glow two" />
      <div className="glow" />
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{ left: e.left, animationDelay: e.delay, animationDuration: e.dur, width: e.size, height: e.size, ["--drift" as string]: e.drift }}
        />
      ))}
      <div className="grain" />
    </div>
  );
}
