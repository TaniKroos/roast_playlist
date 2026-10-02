import { describe, expect, it, vi } from "vitest";
import { generateRoast, type ProviderConfig } from "../worker/llm";

const ROAST = { verdict: "v", tasteLabel: "Two Word", roastLines: ["a", "b", "c"], basicScore: 50, redemption: "r" };

function capture() {
  const calls: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body)) });
    return Response.json({ choices: [{ message: { content: JSON.stringify(ROAST) } }] });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const base: ProviderConfig = {
  name: "azure",
  type: "azure-openai",
  baseUrlEnv: "AZURE_OPENAI_ENDPOINT",
  modelEnv: "AZURE_OPENAI_DEPLOYMENT",
  apiKeyEnv: "AZURE_OPENAI_API_KEY",
  apiVersion: "2024-12-01-preview",
  omitTemperature: true,
  reasoningEffort: "low",
};

describe("azure-openai adapter", () => {
  it("v1 endpoint: model = deployment, no api-version, max_completion_tokens, no temperature", async () => {
    const { calls, fetchImpl } = capture();
    const env = { AZURE_OPENAI_ENDPOINT: "https://res.cognitiveservices.azure.com/openai/v1/", AZURE_OPENAI_DEPLOYMENT: "gpt-5.6-terra", AZURE_OPENAI_API_KEY: "k" };
    await generateRoast([base], { system: "s", user: "u" }, { env, fetchImpl });
    expect(calls[0].url).toBe("https://res.cognitiveservices.azure.com/openai/v1/chat/completions");
    expect(calls[0].headers["api-key"]).toBe("k");
    expect(calls[0].body).toMatchObject({ model: "gpt-5.6-terra", max_completion_tokens: 450, reasoning_effort: "low" });
    expect(calls[0].body).not.toHaveProperty("temperature");
    expect(calls[0].body).not.toHaveProperty("max_tokens");
  });

  it("classic endpoint: deployment in path + api-version", async () => {
    const { calls, fetchImpl } = capture();
    const env = { AZURE_OPENAI_ENDPOINT: "https://res.openai.azure.com", AZURE_OPENAI_DEPLOYMENT: "my gpt", AZURE_OPENAI_API_KEY: "k" };
    await generateRoast([{ ...base, omitTemperature: false, reasoningEffort: undefined }], { system: "s", user: "u" }, { env, fetchImpl });
    expect(calls[0].url).toBe("https://res.openai.azure.com/openai/deployments/my%20gpt/chat/completions?api-version=2024-12-01-preview");
    expect(calls[0].body).not.toHaveProperty("model");
    expect(calls[0].body.temperature).toBe(0.9);
  });

  it("missing endpoint env → falls through as an error, not a crash", async () => {
    const { fetchImpl } = capture();
    await expect(generateRoast([base], { system: "s", user: "u" }, { env: { AZURE_OPENAI_API_KEY: "k" }, fetchImpl })).rejects.toMatchObject({
      attempts: [{ provider: "azure", outcome: "endpoint or deployment missing" }],
    });
  });
});
