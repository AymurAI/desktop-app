import { describe, expect, it } from "vitest";
import type { ExportDocument } from "../types";
import { WATERMARK_TEXT } from "../watermark";
import { renderTxt } from "./txt";

describe("renderTxt", () => {
  it("renders title, speaker and timestamp when present, ending with the watermark", () => {
    const doc: ExportDocument = {
      title: "Audiencia",
      blocks: [
        { speaker: "Persona 1", timestamp: "00:05", text: "Hola" },
        { speaker: "Juez", timestamp: "00:10", text: "Buenas tardes" },
      ],
    };
    expect(renderTxt(doc)).toBe(
      `Audiencia\n\n[00:05] Persona 1: Hola\n\n[00:10] Juez: Buenas tardes\n\n${WATERMARK_TEXT}`,
    );
  });

  it("omits the title line when includeTitle is false (title undefined)", () => {
    const doc: ExportDocument = {
      blocks: [{ speaker: "Persona 1", timestamp: "00:05", text: "Hola" }],
    };
    expect(renderTxt(doc)).toBe(`[00:05] Persona 1: Hola\n\n${WATERMARK_TEXT}`);
  });

  it("omits speaker/timestamp prefixes independently when absent", () => {
    expect(renderTxt({ blocks: [{ timestamp: "00:05", text: "Hola" }] })).toBe(
      `[00:05] Hola\n\n${WATERMARK_TEXT}`,
    );
    expect(renderTxt({ blocks: [{ speaker: "Juez", text: "Hola" }] })).toBe(
      `Juez: Hola\n\n${WATERMARK_TEXT}`,
    );
    expect(renderTxt({ blocks: [{ text: "Hola" }] })).toBe(
      `Hola\n\n${WATERMARK_TEXT}`,
    );
  });

  it("always appends the watermark as the final line, blank-line separated", () => {
    const rendered = renderTxt({ blocks: [{ text: "Hola" }] });
    expect(rendered.endsWith(WATERMARK_TEXT)).toBe(true);
  });
});
