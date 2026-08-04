import { describe, expect, it } from "vitest";
import { stripKnownExtension } from "./strip-known-extension";

const MEDIA_EXTENSIONS = ["wav", "mp3", "mp4"];
const DOCUMENT_EXTENSIONS = ["docx", "pdf"];

describe("stripKnownExtension", () => {
  it("strips a known extension case-insensitively", () => {
    expect(stripKnownExtension("audiencia.wav", MEDIA_EXTENSIONS)).toBe(
      "audiencia",
    );
    expect(stripKnownExtension("audiencia.MP3", MEDIA_EXTENSIONS)).toBe(
      "audiencia",
    );
    expect(
      stripKnownExtension("audiencia.video.final.MP4", MEDIA_EXTENSIONS),
    ).toBe("audiencia.video.final");
  });

  it("leaves names without a known extension (for the given list) untouched", () => {
    expect(stripKnownExtension("audiencia", MEDIA_EXTENSIONS)).toBe(
      "audiencia",
    );
    expect(stripKnownExtension("audiencia.docx", MEDIA_EXTENSIONS)).toBe(
      "audiencia.docx",
    );
  });

  it("does not strip down to an empty string", () => {
    expect(stripKnownExtension(".wav", MEDIA_EXTENSIONS)).toBe(".wav");
  });

  it("checks against the extensions list passed in, e.g. DOCUMENT_EXTENSIONS", () => {
    expect(stripKnownExtension("acta.docx", DOCUMENT_EXTENSIONS)).toBe("acta");
    expect(stripKnownExtension("acta.pdf", DOCUMENT_EXTENSIONS)).toBe("acta");
    expect(stripKnownExtension("acta.wav", DOCUMENT_EXTENSIONS)).toBe(
      "acta.wav",
    );
  });
});
