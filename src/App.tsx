import { useCallback, useEffect, useRef, useState } from "react";
import type { ErrorCode, Roast, RoastMeta, RoastRequest } from "../shared/types";
import { Ambient } from "./components/Ambient";
import { Footer, Topbar } from "./components/Chrome";
import { ErrorView } from "./components/ErrorView";
import { Home, type FormState } from "./components/Home";
import { Loading } from "./components/Loading";
import { Privacy } from "./components/Privacy";
import { Result } from "./components/Result";
import { getConfig, requestRoast } from "./lib/api";
import { useTurnstile } from "./lib/turnstile";

type View =
  | { kind: "home" }
  | { kind: "loading" }
  | { kind: "result"; roast: Roast; meta: RoastMeta }
  | { kind: "error"; code: ErrorCode; message: string }
  | { kind: "privacy" };

const initialView = (): View => (window.location.pathname === "/privacy" ? { kind: "privacy" } : { kind: "home" });

export default function App() {
  const [view, setView] = useState<View>(initialView);
  const [form, setForm] = useState<FormState>({ mode: "link", link: "", songs: "", language: "english" });
  const [siteKey, setSiteKey] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const lastRequest = useRef<Omit<RoastRequest, "turnstileToken"> | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const { slot, getToken } = useTurnstile(siteKey);

  useEffect(() => {
    getConfig().then((c) => setSiteKey(c.turnstileSiteKey));
  }, []);

  const navigate = useCallback((next: View, path: string) => {
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => setView(initialView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(""), 2800);
  }, []);

  const run = useCallback(
    async (req: Omit<RoastRequest, "turnstileToken">) => {
      lastRequest.current = req;
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      setView({ kind: "loading" });
      window.scrollTo({ top: 0 });

      let token = "";
      try {
        token = await getToken();
      } catch {
        setView({ kind: "error", code: "captcha_failed", message: "We couldn't confirm you're human. Refresh the page and try again." });
        return;
      }
      try {
        const res = await requestRoast({ ...req, turnstileToken: token }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setView(res.ok ? { kind: "result", roast: res.roast, meta: res.meta } : { kind: "error", code: res.code, message: res.message });
      } catch {
        /* aborted */
      }
    },
    [getToken],
  );

  const submit = () =>
    run({ mode: form.mode, input: form.mode === "link" ? form.link.trim() : form.songs, language: form.language });

  const goHome = () => {
    inflight.current?.abort();
    navigate({ kind: "home" }, "/");
  };
  const retry = () => lastRequest.current && run(lastRequest.current);

  return (
    <div className="shell">
      <Ambient heat={view.kind === "loading" || view.kind === "result"} />
      <Topbar onHome={goHome} onPrivacy={() => navigate({ kind: "privacy" }, "/privacy")} />
      <main className="wrap">
        {view.kind === "home" && <Home form={form} setForm={setForm} onSubmit={submit} />}
        {view.kind === "loading" && <Loading language={form.language} />}
        {view.kind === "result" && <Result roast={view.roast} meta={view.meta} onAgain={goHome} onRetry={retry} toast={toast} />}
        {view.kind === "error" && (
          <ErrorView
            code={view.code}
            message={view.message}
            onRetry={retry}
            onBack={goHome}
            onPaste={() => {
              setForm((f) => ({ ...f, mode: "paste" }));
              navigate({ kind: "home" }, "/");
            }}
          />
        )}
        {view.kind === "privacy" && <Privacy onBack={goHome} />}
      </main>
      {/* One persistent slot: invisible unless Cloudflare asks for an interaction */}
      <div className="turnstile-dock" ref={slot} />
      <Footer onPrivacy={() => navigate({ kind: "privacy" }, "/privacy")} />
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
