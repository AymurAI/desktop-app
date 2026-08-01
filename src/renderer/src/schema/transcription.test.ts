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

// G7 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md), criterion
// 4: the cap grew from 2 to 3 characters so "Persona 10"/"11"/"12" ("P10",
// "P11", "P12") validate - a relaxation, so 2-char initials like "P1" stay
// valid too. Still bounded at 3: a 4th character would overflow the
// avatar's 24px circle.
describe("speaker initials length", () => {
  it("accepts 3-character initials", () => {
    expect(
      SpeakerSchema.safeParse({
        id: "s1",
        label: "Persona 10",
        initials: "P10",
        color: "violet",
      }).success,
    ).toBe(true);
  });

  it("rejects 4-character initials", () => {
    expect(
      SpeakerSchema.safeParse({
        id: "s1",
        label: "Persona 100",
        initials: "P100",
        color: "violet",
      }).success,
    ).toBe(false);
  });
});
