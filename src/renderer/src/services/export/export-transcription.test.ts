import type { Transcription } from "@/types/transcription";
import { describe, expect, it, vi } from "vitest";
import { exportTranscription } from "./export-transcription";
import { DEFAULT_EXPORT_OPTIONS } from "./types";

// jsdom's Blob has no text()/arrayBuffer(), unlike a real browser's.
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

const convertOdtToPdf = vi.fn(async (_blob: Blob) => new Blob(["pdf-bytes"]));

vi.mock("@/services/aymurai/queries", () => ({
  convertOdtToPdf: (blob: Blob) => convertOdtToPdf(blob),
}));

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia 10/04/2025",
  audioFileName: "a.mp3",
  audioDurationMs: 5000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "primary" },
  ],
  turns: [{ id: "t1", speakerId: "s1", text: "Hola", startMs: 0, endMs: 1000 }],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("exportTranscription", () => {
  it("generates a .txt with a sanitized file name", async () => {
    const result = await exportTranscription(
      transcription,
      "txt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("Audiencia 10042025.txt");
    expect(await blobToText(result.blob)).toContain("Hola");
    expect(convertOdtToPdf).not.toHaveBeenCalled();
  });

  it("generates a .odt without calling the pdf converter", async () => {
    const result = await exportTranscription(
      transcription,
      "odt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("Audiencia 10042025.odt");
    expect(convertOdtToPdf).not.toHaveBeenCalled();
  });

  it("builds an .odt and pipes it through the backend odt->pdf converter for .pdf", async () => {
    const result = await exportTranscription(
      transcription,
      "pdf",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("Audiencia 10042025.pdf");
    expect(convertOdtToPdf).toHaveBeenCalledTimes(1);
    expect(await blobToText(result.blob)).toBe("pdf-bytes");
  });
});

describe("exportTranscription file name sanitization", () => {
  it("keeps punctuation that is valid in a file name (dashes, brackets, º, accents)", async () => {
    const result = await exportTranscription(
      { ...transcription, title: "[APELLIDO] - 1º parte - cropped" },
      "txt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("[APELLIDO] - 1º parte - cropped.txt");
  });

  it("strips a trailing known media extension carried over from the source audio file name", async () => {
    const result = await exportTranscription(
      { ...transcription, title: "[APELLIDO] - 1º parte - cropped.wav" },
      "odt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("[APELLIDO] - 1º parte - cropped.odt");
  });

  it("removes OS-illegal file name characters without stripping the rest of the title", async () => {
    const result = await exportTranscription(
      { ...transcription, title: 'Audiencia: "Juicio" / Sala 3' },
      "txt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("Audiencia Juicio  Sala 3.txt");
  });

  it("falls back to a default name when the title is entirely illegal characters", async () => {
    const result = await exportTranscription(
      { ...transcription, title: "???***" },
      "txt",
      DEFAULT_EXPORT_OPTIONS,
    );
    expect(result.fileName).toBe("transcripcion.txt");
  });
});
