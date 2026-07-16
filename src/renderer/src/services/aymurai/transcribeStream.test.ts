import { fetchEventSource } from "@microsoft/fetch-event-source";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/services/api";
import { transcribeStream } from "./transcribeStream";

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: vi.fn(),
}));

const mockedFetchEventSource = vi.mocked(fetchEventSource);

function emitEvents(events: unknown[]) {
  mockedFetchEventSource.mockImplementation(async (_url, options) => {
    for (const event of events) {
      options.onmessage?.({
        data: JSON.stringify(event),
        event: "",
        id: "",
        retry: 0,
      });
    }
  });
}

describe("transcribeStream", () => {
  beforeEach(() => {
    mockedFetchEventSource.mockReset();
    api.defaults.baseURL = "http://asr.test";
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: vi.fn(() => "blob:audio") }),
    );
  });

  it("passes use_cache in the stream URL", async () => {
    emitEvents([
      {
        type: "meta",
        document_id: "doc-cache-url",
        duration: null,
      },
      {
        type: "segments",
        document: [],
        speaker_turns: [],
      },
      {
        type: "done",
        progress: 1,
      },
    ]);

    await transcribeStream(new File(["audio"], "sample.mp3"), {
      useCache: true,
    });

    expect(mockedFetchEventSource).toHaveBeenCalledWith(
      "http://asr.test/asr/transcribe/stream?use_cache=true",
      expect.any(Object),
    );
  });

  it("uses the browser-reported duration before ASR segment boundaries", async () => {
    emitEvents([
      {
        type: "meta",
        document_id: "doc-local-duration",
        duration: 12.5,
      },
      {
        type: "segments",
        document: [
          {
            speaker_no: 1,
            start: "PT0S",
            end: "PT10S",
            text: "Texto",
          },
        ],
        speaker_turns: [],
      },
      { type: "done", progress: 1 },
    ]);

    const result = await transcribeStream(new File(["audio"], "sample.mp3"), {
      useCache: false,
      durationMs: 11_284.6,
    });

    expect(result.audioDurationMs).toBe(11_285);
  });

  it("uses meta.duration when no browser duration is available", async () => {
    emitEvents([
      {
        type: "meta",
        document_id: "doc-meta-duration",
        duration: 11.2846,
      },
      {
        type: "segments",
        document: [
          {
            speaker_no: 1,
            start: "PT0S",
            end: "PT10S",
            text: "Texto",
          },
        ],
        speaker_turns: [],
      },
      { type: "done", progress: 1 },
    ]);

    const result = await transcribeStream(new File(["audio"], "sample.mp3"), {
      useCache: false,
    });

    expect(result.audioDurationMs).toBe(11_285);
  });

  it("uses validation from a segments event as the editable transcript", async () => {
    emitEvents([
      {
        type: "meta",
        document_id: "doc-validation",
        title: "Titulo desde meta",
        duration: null,
      },
      {
        type: "segments",
        title: "Titulo desde segments",
        document: [
          {
            speaker_no: 1,
            start: "PT1S",
            end: "PT2S",
            text: "Texto fresco",
            paragraph_id: "fresh",
          },
        ],
        speaker_turns: [],
        transcription: [
          {
            speaker_no: 2,
            speaker_name: "Cache",
            start: "PT3S",
            end: "PT4S",
            text: "Texto cacheado",
            paragraph_id: "cached",
          },
        ],
        validation: [
          {
            speaker_no: 3,
            speaker_name: "Validacion",
            start: "PT5S",
            end: "PT6S",
            text: "Texto validado",
            paragraph_id: "validated",
          },
        ],
      },
      {
        type: "done",
        progress: 1,
      },
    ]);

    const onPartialText = vi.fn();
    const result = await transcribeStream(new File(["audio"], "sample.mp3"), {
      useCache: true,
      onPartialText,
    });

    expect(result.source).toBe("validation");
    expect(result.title).toBe("Titulo desde segments");
    expect(result.turns[0]).toMatchObject({
      id: "validated",
      speakerId: "s3",
      text: "Texto validado",
    });
    expect(onPartialText).toHaveBeenLastCalledWith("Texto validado");
  });

  it("uses transcription from a segments event when validation is empty", async () => {
    emitEvents([
      {
        type: "meta",
        document_id: "doc-transcription",
        title: "Titulo cacheado",
        duration: null,
      },
      {
        type: "segments",
        document: [
          {
            speaker_no: 1,
            start: "PT1S",
            end: "PT2S",
            text: "Texto fresco",
            paragraph_id: "fresh",
          },
        ],
        speaker_turns: [],
        transcription: [
          {
            speaker_no: 2,
            speaker_name: "Cache",
            start: "PT3S",
            end: "PT4S",
            text: "Texto cacheado",
            paragraph_id: "cached",
          },
        ],
        validation: [],
      },
      {
        type: "done",
        progress: 1,
      },
    ]);

    const onPartialText = vi.fn();
    const result = await transcribeStream(new File(["audio"], "sample.mp3"), {
      useCache: false,
      onPartialText,
    });

    expect(result.source).toBe("transcription");
    expect(result.title).toBe("Titulo cacheado");
    expect(result.turns[0]).toMatchObject({
      id: "cached",
      speakerId: "s2",
      text: "Texto cacheado",
    });
    expect(onPartialText).toHaveBeenLastCalledWith("Texto cacheado");
  });
});
