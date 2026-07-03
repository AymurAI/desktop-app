import { describe, expect, it } from "vitest";
import { stripKnownMediaExtension } from "./strip-known-media-extension";

describe("stripKnownMediaExtension", () => {
  it("strips a known audio/video extension case-insensitively", () => {
    expect(stripKnownMediaExtension("audiencia.wav")).toBe("audiencia");
    expect(stripKnownMediaExtension("audiencia.MP3")).toBe("audiencia");
    expect(stripKnownMediaExtension("audiencia.video.final.MP4")).toBe(
      "audiencia.video.final",
    );
  });

  it("leaves names without a known media extension untouched", () => {
    expect(stripKnownMediaExtension("audiencia")).toBe("audiencia");
    expect(stripKnownMediaExtension("audiencia.docx")).toBe("audiencia.docx");
  });

  it("does not strip down to an empty string", () => {
    expect(stripKnownMediaExtension(".wav")).toBe(".wav");
  });
});
