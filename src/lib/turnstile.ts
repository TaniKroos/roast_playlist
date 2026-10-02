// Cloudflare Turnstile in "execute" mode: invisible unless Cloudflare wants an interaction.
import { useCallback, useEffect, useRef } from "react";

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  execute(idOrEl: string | HTMLElement): void;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function useTurnstile(siteKey: string) {
  const slot = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const pending = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        if (cancelled || !slot.current || widget.current) return;
        widget.current = ts.render(slot.current, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          theme: "dark",
          callback: (token: string) => {
            pending.current?.resolve(token);
            pending.current = null;
          },
          "error-callback": () => {
            pending.current?.reject(new Error("turnstile error"));
            pending.current = null;
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  /** Resolves with a fresh single-use token. */
  const getToken = useCallback(async (): Promise<string> => {
    if (!siteKey) return "";
    const ts = await loadScript();
    for (let i = 0; i < 40 && !widget.current; i++) await new Promise((r) => setTimeout(r, 100));
    if (!widget.current) throw new Error("turnstile not ready");
    ts.reset(widget.current);
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      ts.execute(widget.current!);
      setTimeout(() => {
        if (pending.current) {
          pending.current.reject(new Error("turnstile timeout"));
          pending.current = null;
        }
      }, 30_000);
    });
  }, [siteKey]);

  return { slot, getToken };
}
