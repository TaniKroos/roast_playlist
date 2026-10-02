import { ProviderError } from "./types";

export async function postJson(fetchImpl: typeof fetch, url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal): Promise<unknown> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    // Don't read/log the error body: it can echo our prompt back.
    throw new ProviderError(`HTTP ${res.status}`, res.status);
  }
  return res.json();
}
