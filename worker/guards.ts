// Abuse + cost protection. Nothing here stores anything that identifies a visitor.

export async function verifyTurnstile(token: string, secret: string | undefined, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!secret || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  // Deliberately not sending remoteip.
  try {
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export interface Counter {
  get(): Promise<number>;
  increment(): Promise<void>;
}

/**
 * Anonymous aggregate counter for paid LLM calls today (UTC). One KV key per day holding
 * just an integer; expires after 2 days. KV is eventually consistent, so the cap is
 * approximate (can overshoot by a few calls under bursts), which is fine for a cost cap.
 */
export function dailyPaidCounter(kv: KVNamespace | undefined, now = new Date()): Counter {
  const key = `paid-calls:${now.toISOString().slice(0, 10)}`;
  if (!kv) {
    let n = 0;
    return { get: async () => n, increment: async () => void n++ };
  }
  return {
    get: async () => Number((await kv.get(key)) ?? 0),
    increment: async () => {
      const n = Number((await kv.get(key)) ?? 0);
      await kv.put(key, String(n + 1), { expirationTtl: 172_800 });
    },
  };
}
