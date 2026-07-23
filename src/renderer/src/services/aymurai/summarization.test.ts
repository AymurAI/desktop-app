import { describe, expect, it } from "vitest";
import { parseSseMessages } from "./summarization";

describe("parseSseMessages", () => {
  it("parses a single complete SSE frame", () => {
    const buffer = 'data: {"type":"meta","model":"gpt"}\n\n';
    const { events, remainder } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "meta", model: "gpt" }]);
    expect(remainder).toBe("");
  });

  it("parses multiple frames delivered in one chunk", () => {
    const buffer =
      'data: {"type":"token","text":"Hola"}\n\n' +
      'data: {"type":"token","text":" mundo"}\n\n';
    const { events } = parseSseMessages(buffer);
    expect(events).toEqual([
      { type: "token", text: "Hola" },
      { type: "token", text: " mundo" },
    ]);
  });

  it("keeps an incomplete trailing frame as the remainder", () => {
    const buffer =
      'data: {"type":"token","text":"Hola"}\n\n' + 'data: {"type":"tok';
    const { events, remainder } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "token", text: "Hola" }]);
    expect(remainder).toBe('data: {"type":"tok');
  });

  it("skips a malformed frame without throwing", () => {
    const buffer = "data: not json\n\n" + 'data: {"type":"meta"}\n\n';
    const { events } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "meta" }]);
  });

  it("returns an empty remainder and no events for an empty buffer", () => {
    expect(parseSseMessages("")).toEqual({ events: [], remainder: "" });
  });
});
