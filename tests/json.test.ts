import { describe, expect, it } from "vitest";
import { extractJson, validateRoast } from "../worker/llm/json";

const good = {
  verdict: "Your playlist is a 2014 college fest.",
  tasteLabel: "Certified 2am Arijit Survivor",
  roastLines: ["one", "two", "three"],
  basicScore: 72,
  redemption: "At least you have feelings.",
};

describe("extractJson", () => {
  it("handles fences, preambles and think blocks", () => {
    expect(extractJson("```json\n" + JSON.stringify(good) + "\n```")).toEqual(good);
    expect(extractJson("Sure! Here you go: " + JSON.stringify(good) + " Hope that helps")).toEqual(good);
    expect(extractJson("<think>the user wants {json}</think>\n" + JSON.stringify(good))).toEqual(good);
    expect(extractJson("reasoning about {braces}...</think>" + JSON.stringify(good))).toEqual(good);
  });
  it("throws when there is no JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("validateRoast", () => {
  it("accepts a valid roast", () => {
    expect(validateRoast(good)).toEqual(good);
  });
  it("coerces numeric strings and clamps score", () => {
    expect(validateRoast({ ...good, basicScore: "88" })?.basicScore).toBe(88);
    expect(validateRoast({ ...good, basicScore: 140 })?.basicScore).toBe(100);
  });
  it("clips long strings and extra lines", () => {
    const r = validateRoast({ ...good, verdict: "word ".repeat(40), roastLines: Array(7).fill("x") })!;
    expect(r.verdict.length).toBeLessThanOrEqual(90);
    expect(r.roastLines).toHaveLength(5);
  });
  it.each([
    null,
    [],
    { ...good, verdict: "" },
    { ...good, roastLines: ["only", "two"] },
    { ...good, roastLines: "nope" },
    { ...good, basicScore: "very" },
    { ...good, redemption: undefined },
  ])("rejects invalid: %j", (bad) => {
    expect(validateRoast(bad)).toBeNull();
  });
});
