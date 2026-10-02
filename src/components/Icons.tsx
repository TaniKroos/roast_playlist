import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const FlameLogo = (p: P) => (
  <svg viewBox="0 0 64 64" aria-hidden {...p}>
    <path d="M33 8c2 9 13 14 13 28a14 14 0 0 1-28 0c0-7 4-11 7-14 0 5 2 8 5 9-2-8 1-17 3-23z" fill="#9db8ff" />
    <path d="M32 34c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z" fill="#e6ecff" />
  </svg>
);
export const YouTubeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="#ff0033" />
    <path d="M10 8.8v6.4l5.6-3.2z" fill="#fff" />
  </svg>
);
export const SpotifyIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <circle cx="12" cy="12" r="10.5" fill="#1ed760" />
    <path d="M6.8 9.4c3.6-1 7.6-.7 10.6 1M7.4 12.4c3-.8 6.2-.5 8.7.9M8 15.2c2.4-.6 4.7-.4 6.7.7" stroke="#000" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);
export const AppleMusicIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#fa2d48" />
    <path d="M15.5 6.2v8.3a2 2 0 1 1-1.3-1.9V8.4l-4.6 1v6.3a2 2 0 1 1-1.3-1.9V7.9z" fill="#fff" />
  </svg>
);
export const AmazonMusicIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#25d1da" />
    <path d="M6.5 15.2c3.3 2 7.8 2.2 11 .3" stroke="#0f1317" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    <path d="M15.6 14.4l2.2 1.1-.9 2.2" stroke="#0f1317" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M9 12V7.2l5-1v4.6" stroke="#0f1317" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
export const LinkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16" />
  </svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V3m0 0L7 8m5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>
);
export const RedoIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16m0 5v-5h5" />
  </svg>
);
export const WarnIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
);
