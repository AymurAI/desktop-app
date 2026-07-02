import { describe, expect, it } from "vitest";
import { SUGGESTED_SPEAKERS } from "./suggestedSpeakers";

describe("SUGGESTED_SPEAKERS", () => {
  it("exposes the courtroom role suggestions used by voice-to-text editors", () => {
    expect(SUGGESTED_SPEAKERS.map((speaker) => speaker.label)).toEqual([
      "Juez/a",
      "Fiscal",
      "Defensor/a",
      "Querella",
      "Denunciante",
      "Acusado/a",
      "Testigo/a",
      "Niño/a - Adolescente",
    ]);
  });
});
