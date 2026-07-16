import {
  LEGACY_SPEAKER_COLORS,
  SPEAKER_COLORS,
  SPEAKER_PALETTE,
} from "@/types/transcription";
import { describe, expect, it } from "vitest";
import { SpeakerSchema } from "./transcription";

describe("speaker colors", () => {
  it("defines the seven generated colors before the legacy compatibility set", () => {
    expect(SPEAKER_PALETTE).toEqual([
      "violet",
      "green",
      "red",
      "yellow",
      "pink",
      "orange",
      "blue",
    ]);
    expect(SPEAKER_COLORS).toEqual([
      ...SPEAKER_PALETTE,
      ...LEGACY_SPEAKER_COLORS,
    ]);
  });

  it.each(SPEAKER_COLORS)("accepts %s", (color) => {
    expect(
      SpeakerSchema.safeParse({
        id: "s1",
        label: "Persona",
        initials: "PE",
        color,
      }).success,
    ).toBe(true);
  });
});
