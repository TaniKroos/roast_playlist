import type { PublicConfig, RoastRequest, RoastResponse } from "../../shared/types";

export async function getConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch("/api/config");
    if (res.ok) return (await res.json()) as PublicConfig;
  } catch {
    /* fall through */
  }
  return { turnstileSiteKey: "" };
}

export async function requestRoast(body: RoastRequest, signal?: AbortSignal): Promise<RoastResponse> {
  try {
    const res = await fetch("/api/roast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const data = (await res.json().catch(() => null)) as RoastResponse | null;
    if (data) return data;
    return { ok: false, code: "roaster_choked", message: "The roaster choked on your playlist. Try again?" };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return { ok: false, code: "roaster_choked", message: "Couldn't reach the roaster. Check your connection and try again." };
  }
}
