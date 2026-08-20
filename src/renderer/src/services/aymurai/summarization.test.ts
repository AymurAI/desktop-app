import { CanceledError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/services/api";
import { parseSseMessages, summarizeStream } from "./summarization";

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

describe("summarizeStream", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    api.defaults.baseURL = "http://llm.test";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("converts an aborted request into a CanceledError, matching transcribeStream", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(
        new DOMException("The operation was aborted.", "AbortError"),
      );
    const controller = new AbortController();
    controller.abort();

    await expect(
      summarizeStream("texto", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(CanceledError);
  });

  it("does not mask a non-abort fetch failure as CanceledError", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Network error"));

    await expect(summarizeStream("texto", {})).rejects.toThrow("Network error");
  });
});
