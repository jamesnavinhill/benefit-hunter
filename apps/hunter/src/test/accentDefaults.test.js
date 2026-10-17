import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENTS } from "../data/accentDefaults";
import { mergeAccents } from "../lib/accents";

describe("brand accent default", () => {
  it("uses the requested OKLCH accent as the default", () => {
    expect(DEFAULT_ACCENTS.accent).toEqual({ l: 0.555, c: 0.19, h: 342 });
  });

  it("migrates the previous built-in yellow while preserving explicit user choices", () => {
    const migrated = mergeAccents({ accent: { l: 0.78, c: 0.16, h: 75 } });
    expect(migrated.accent).toEqual(DEFAULT_ACCENTS.accent);
    const custom = mergeAccents({ accent: { l: 0.6, c: 0.2, h: 180 } });
    expect(custom.accent).toEqual({ l: 0.6, c: 0.2, h: 180 });
  });
});
