// Renders the 1080×1920 story card entirely in the browser. Nothing is uploaded.
import type { Roast, RoastMeta } from "../../shared/types";
import { basicTier } from "./content";

const W = 1080;
const H = 1920;
const C = {
  bg: "#0f1317",
  text: "#e9eef2",
  muted: "#9eabb6",
  faint: "#6d7a85",
  accent: "#9db8ff",
  hot: "#c3b6ff",
  ink: "#0d1326",
  surface: "#1d252d",
};
const DISPLAY = '"Bricolage Grotesque Variable", system-ui, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function noise(ctx: CanvasRenderingContext2D) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 160;
  const t = tile.getContext("2d")!;
  const img = t.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 14;
  }
  t.putImageData(img, 0, 0);
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, W, H);
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 64, s / 64);
  ctx.fillStyle = C.accent;
  ctx.fill(new Path2D("M33 8c2 9 13 14 13 28a14 14 0 0 1-28 0c0-7 4-11 7-14 0 5 2 8 5 9-2-8 1-17 3-23z"));
  ctx.fillStyle = "#e6ecff";
  ctx.fill(new Path2D("M32 34c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z"));
  ctx.restore();
}

export async function renderShareCard(roast: Roast, meta: RoastMeta, host: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  await Promise.all([document.fonts.load(`800 100px ${DISPLAY}`), document.fonts.load(`500 30px ${MONO}`)]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const PAD = 88;

  // Background + ember glow
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W / 2, H + 140, 40, W / 2, H + 140, 1250);
  g.addColorStop(0, "rgba(157, 184, 255, 0.45)");
  g.addColorStop(0.35, "rgba(157, 184, 255, 0.132)");
  g.addColorStop(1, "rgba(157, 184, 255, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(0, 0, 10, 0, 0, 900);
  g.addColorStop(0, "rgba(195, 182, 255, 0.112)");
  g.addColorStop(1, "rgba(195, 182, 255, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Embers
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * W;
    const y = H * 0.45 + Math.random() * H * 0.55;
    const r = Math.random() * 3.2 + 0.8;
    ctx.fillStyle = `rgba(${150 + Math.random() * 50},${175 + Math.random() * 15},255,${0.12 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx);

  // Brand row
  flame(ctx, PAD - 6, 104, 70);
  ctx.fillStyle = C.text;
  ctx.font = `800 44px ${DISPLAY}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Taste", PAD + 76, 140);
  const tw = ctx.measureText("Taste ").width;
  ctx.fillStyle = C.accent;
  ctx.fillText("Kharab", PAD + 76 + tw, 140);
  ctx.font = `600 24px ${MONO}`;
  ctx.fillStyle = C.faint;
  ctx.textAlign = "right";
  ctx.fillText("ROAST REPORT", W - PAD, 140);
  ctx.textAlign = "left";

  // Divider
  ctx.strokeStyle = "rgba(220, 232, 245, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 212);
  ctx.lineTo(W - PAD, 212);
  ctx.stroke();

  // Kicker
  ctx.font = `600 28px ${MONO}`;
  ctx.fillStyle = C.muted;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MY PLAYLIST GOT COOKED 🔥", PAD, 300);

  // Sticker (taste label)
  ctx.font = `800 52px ${DISPLAY}`;
  const label = roast.tasteLabel;
  const labelLines = wrap(ctx, label, W - PAD * 2 - 80).slice(0, 2);
  const lw = Math.max(...labelLines.map((l) => ctx.measureText(l).width)) + 64;
  const lh = labelLines.length * 62 + 40;
  ctx.save();
  ctx.translate(PAD + 10, 350);
  ctx.rotate((-2.5 * Math.PI) / 180);
  ctx.fillStyle = "rgba(195,182,255,0.35)";
  roundRect(ctx, 10, 10, lw, lh, 20);
  ctx.fill();
  ctx.fillStyle = C.accent;
  roundRect(ctx, 0, 0, lw, lh, 20);
  ctx.fill();
  ctx.fillStyle = C.ink;
  labelLines.forEach((l, i) => ctx.fillText(l, 32, 74 + i * 62));
  ctx.restore();

  // Verdict: auto-fit
  let y = 350 + lh + 130;
  const maxVerdictH = 560;
  let size = 112;
  let vLines: string[] = [];
  for (; size >= 60; size -= 4) {
    ctx.font = `800 ${size}px ${DISPLAY}`;
    vLines = wrap(ctx, roast.verdict, W - PAD * 2);
    if (vLines.length * size * 1.02 <= maxVerdictH) break;
  }
  ctx.fillStyle = C.text;
  ctx.font = `800 ${size}px ${DISPLAY}`;
  for (const l of vLines) {
    ctx.fillText(l, PAD, y);
    y += size * 1.02;
  }

  // Best burn
  // Score block, anchored to the bottom
  const scoreTop = H - 560;

  // Best burn, only as many lines as fit above the score block
  y += 40;
  const burn = roast.roastLines[0];
  ctx.font = `500 38px ${DISPLAY}`;
  const room = Math.max(0, Math.min(4, Math.floor((scoreTop - 60 - y) / 52)));
  let bLines = wrap(ctx, `“${burn}”`, W - PAD * 2 - 40);
  if (bLines.length > room) bLines = room ? [...bLines.slice(0, room - 1), bLines[room - 1].replace(/\s*\S*$/, "") + "…”"] : [];
  if (bLines.length) {
    ctx.fillStyle = C.accent;
    ctx.fillRect(PAD, y - 34, 6, bLines.length * 52 - 4);
    ctx.fillStyle = C.muted;
    bLines.forEach((l, i) => ctx.fillText(l, PAD + 34, y + i * 52));
  }

  ctx.fillStyle = "rgba(22, 28, 34, 0.82)";
  roundRect(ctx, PAD, scoreTop, W - PAD * 2, 300, 36);
  ctx.fill();
  ctx.strokeStyle = "rgba(220, 232, 245, 0.1)";
  ctx.stroke();
  ctx.font = `600 26px ${MONO}`;
  ctx.fillStyle = C.muted;
  ctx.fillText("BASIC-O-METER", PAD + 44, scoreTop + 70);
  ctx.font = `700 30px ${DISPLAY}`;
  ctx.fillStyle = C.text;
  ctx.fillText(basicTier(roast.basicScore), PAD + 44, scoreTop + 116, 520);
  ctx.textAlign = "right";
  ctx.font = `800 150px ${DISPLAY}`;
  ctx.fillStyle = C.accent;
  ctx.fillText(String(roast.basicScore), W - PAD - 110, scoreTop + 140);
  ctx.font = `600 34px ${DISPLAY}`;
  ctx.fillStyle = C.faint;
  ctx.fillText("/100", W - PAD - 40, scoreTop + 140);
  ctx.textAlign = "left";
  // Bars
  const bars = 20;
  const gap = 8;
  const bw = (W - PAD * 2 - 88 - gap * (bars - 1)) / bars;
  const on = Math.round((roast.basicScore / 100) * bars);
  for (let i = 0; i < bars; i++) {
    ctx.fillStyle = i < on ? (i >= 16 ? C.hot : C.accent) : C.surface;
    roundRect(ctx, PAD + 44 + i * (bw + gap), scoreTop + 180, bw, 64, 8);
    ctx.fill();
  }

  // Stats line
  const top = meta.stats.topArtists[0];
  ctx.font = `600 26px ${MONO}`;
  ctx.fillStyle = C.muted;
  const statsLine = [
    `${meta.stats.trackCount} TRACKS`,
    top ? `${meta.stats.topArtistShare}% ${top.artist.toUpperCase()}` : null,
    `${meta.stats.uniqueArtists} ARTISTS`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  let s = statsLine;
  while (ctx.measureText(s).width > W - PAD * 2 && s.length > 10) s = s.slice(0, -2);
  ctx.fillText(s === statsLine ? s : s + "…", PAD, scoreTop + 370);

  // Footer CTA
  ctx.fillStyle = C.text;
  roundRect(ctx, PAD, H - 150, W - PAD * 2, 92, 46);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.font = `800 36px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Get roasted → ${host}`, W / 2, H - 104);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
