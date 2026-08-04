import { describe, expect, it } from "vitest";
import { sanitizeFileName } from "./sanitize-file-name";

const MEDIA_EXTENSIONS = ["wav", "mp3", "mp4"];
const DOCUMENT_EXTENSIONS = ["docx", "pdf"];

describe("sanitizeFileName", () => {
  it("keeps punctuation that is valid in a file name (dashes, brackets, º, accents)", () => {
    expect(
      sanitizeFileName(
        "[APELLIDO] - 1º parte - cropped",
        MEDIA_EXTENSIONS,
        "default",
      ),
    ).toBe("[APELLIDO] - 1º parte - cropped");
  });

  it("strips a trailing known extension carried over from the source file name", () => {
    expect(sanitizeFileName("acta.docx", DOCUMENT_EXTENSIONS, "resumen")).toBe(
      "acta",
    );
    expect(
      sanitizeFileName("audiencia.wav", MEDIA_EXTENSIONS, "transcripcion"),
    ).toBe("audiencia");
  });

  it("removes OS-illegal file name characters without stripping the rest of the title", () => {
    expect(
      sanitizeFileName(
        'Audiencia: "Juicio" / Sala 3',
        MEDIA_EXTENSIONS,
        "default",
      ),
    ).toBe("Audiencia Juicio  Sala 3");
  });

  it("falls back to the default name when the title is entirely illegal characters", () => {
    expect(sanitizeFileName("???***", MEDIA_EXTENSIONS, "transcripcion")).toBe(
      "transcripcion",
    );
  });

  it("falls back to the default name for an empty title", () => {
    expect(sanitizeFileName("", DOCUMENT_EXTENSIONS, "resumen")).toBe(
      "resumen",
    );
  });
});
