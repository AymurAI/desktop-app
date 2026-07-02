import type { ASRDocument } from "@/schema/asr";
import { describe, expect, it } from "vitest";
import { mapASRDocumentToTranscription } from "./asrMapper";

const audioFile = new File(["audio"], "audiencia.29.06.final.mp3", {
  type: "audio/mpeg",
});

describe("mapASRDocumentToTranscription", () => {
  it("uses speaker_turns as the editable turn source instead of raw document chunks", () => {
    const doc: ASRDocument = {
      document_id: "doc-1",
      title: "Audiencia desde backend",
      document: [
        {
          speaker_no: 1,
          speaker_name: null,
          start: "PT5.84S",
          end: "PT6.64S",
          text: "Nos quedamos,",
          paragraph_id: "segment-1",
        },
        {
          speaker_no: 1,
          speaker_name: null,
          start: "PT6.64S",
          end: "PT15.76S",
          text: "estabamos todos esperando en el lobby.",
          paragraph_id: "segment-2",
        },
      ],
      speaker_turns: [
        {
          speaker: "Speaker 1",
          speaker_no: 1,
          start: "00:00:05.840",
          end: "00:00:15.760",
          text: "Nos quedamos, estabamos todos esperando en el lobby.",
          segments: [
            {
              speaker_no: 1,
              speaker_name: null,
              start: "PT5.84S",
              end: "PT6.64S",
              text: "Nos quedamos,",
              paragraph_id: "segment-1",
            },
            {
              speaker_no: 1,
              speaker_name: null,
              start: "PT6.64S",
              end: "PT15.76S",
              text: "estabamos todos esperando en el lobby.",
              paragraph_id: "segment-2",
            },
          ],
        },
      ],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.title).toBe("Audiencia desde backend");
    expect(transcription.source).toBe("asr");
    expect(transcription.turns).toHaveLength(1);
    expect(transcription.turns[0]).toMatchObject({
      speakerId: "s1",
      speakerNo: 1,
      text: "Nos quedamos, estabamos todos esperando en el lobby.",
      startMs: 5840,
      endMs: 15760,
    });
    expect(transcription.turns[0].segments).toHaveLength(2);
    expect(transcription.speakers[0].label).toBe("Persona 1");
    expect(transcription.rawDocument).toHaveLength(2);
    expect(transcription.rawSpeakerTurns).toHaveLength(1);
  });

  it("uses persisted validation before persisted transcription and fresh asr output", () => {
    const doc: ASRDocument = {
      document_id: "doc-validation-cache",
      document: [
        {
          speaker_no: 1,
          speaker_name: null,
          start: "PT1S",
          end: "PT2S",
          text: "Texto fresco",
          paragraph_id: "fresh",
        },
      ],
      speaker_turns: [
        {
          speaker: "Speaker 1",
          speaker_no: 1,
          start: "00:00:01.000",
          end: "00:00:02.000",
          text: "Texto fresco mergeado",
          segments: [],
        },
      ],
      transcription: [
        {
          speaker_no: 2,
          speaker_name: "Transcripcion cacheada",
          start: "PT3S",
          end: "PT4S",
          text: "Texto cacheado",
          paragraph_id: "cached-transcription",
        },
      ],
      validation: [
        {
          speaker_no: 3,
          speaker_name: "Validacion",
          start: "PT5S",
          end: "PT6S",
          text: "Texto validado",
          paragraph_id: "cached-validation",
        },
      ],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.source).toBe("validation");
    expect(transcription.turns).toHaveLength(1);
    expect(transcription.turns[0]).toMatchObject({
      id: "cached-validation",
      speakerId: "s3",
      text: "Texto validado",
      startMs: 5000,
    });
    expect(transcription.speakers[0].label).toBe("Validacion");
    expect(transcription.rawValidation).toHaveLength(1);
    expect(transcription.rawTranscription).toHaveLength(1);
  });

  it("uses persisted transcription when validation is empty", () => {
    const doc: ASRDocument = {
      document_id: "doc-transcription-cache",
      document: [
        {
          speaker_no: 1,
          speaker_name: null,
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
          paragraph_id: "cached-transcription",
        },
      ],
      validation: [],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.source).toBe("transcription");
    expect(transcription.turns).toHaveLength(1);
    expect(transcription.turns[0]).toMatchObject({
      id: "cached-transcription",
      speakerId: "s2",
      text: "Texto cacheado",
      startMs: 3000,
    });
    expect(transcription.speakers[0].label).toBe("Cache");
  });

  it("falls back to one turn per document segment for legacy responses", () => {
    const doc: ASRDocument = {
      document_id: "doc-legacy",
      document: [
        {
          speaker_no: 1,
          speaker_name: null,
          start: "PT5S",
          end: "PT6S",
          text: "Primer chunk",
          paragraph_id: "segment-1",
        },
        {
          speaker_no: 1,
          speaker_name: null,
          start: "PT6S",
          end: "PT7S",
          text: "Segundo chunk",
          paragraph_id: "segment-2",
        },
      ],
      speaker_turns: [],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.source).toBe("asr");
    expect(transcription.turns).toHaveLength(2);
    expect(transcription.turns.map((turn) => turn.text)).toEqual([
      "Primer chunk",
      "Segundo chunk",
    ]);
    expect(transcription.rawDocument).toHaveLength(2);
    expect(transcription.rawSpeakerTurns).toEqual([]);
  });

  it("preserves and renders speaker -1 turns from speaker_turns", () => {
    const doc: ASRDocument = {
      document_id: "doc-negative-speaker",
      document: [
        {
          speaker_no: -1,
          speaker_name: null,
          start: "PT8S",
          end: "PT10S",
          text: "Texto transcripto sin speaker confiable.",
          paragraph_id: "segment-negative",
        },
      ],
      speaker_turns: [
        {
          speaker: "Speaker -1",
          speaker_no: -1,
          start: "00:00:08.000",
          end: "00:00:10.000",
          text: "Texto transcripto sin speaker confiable.",
          segments: [
            {
              speaker_no: -1,
              speaker_name: null,
              start: "PT8S",
              end: "PT10S",
              text: "Texto transcripto sin speaker confiable.",
              paragraph_id: "segment-negative",
            },
          ],
        },
      ],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.speakers).toContainEqual(
      expect.objectContaining({ id: "s-1", label: "Speaker -1" }),
    );
    expect(transcription.turns).toHaveLength(1);
    expect(transcription.turns[0]).toMatchObject({
      speakerId: "s-1",
      speakerNo: -1,
      text: "Texto transcripto sin speaker confiable.",
      startMs: 8000,
    });
  });

  it("preserves speaker -1 document segments for legacy responses", () => {
    const doc: ASRDocument = {
      document_id: "doc-legacy-negative-speaker",
      document: [
        {
          speaker_no: -1,
          speaker_name: null,
          start: "PT2S",
          end: "PT3S",
          text: "Chunk con speaker negativo",
          paragraph_id: "segment-negative",
        },
      ],
      speaker_turns: [],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.speakers).toContainEqual(
      expect.objectContaining({ id: "s-1", label: "Speaker -1" }),
    );
    expect(transcription.turns).toHaveLength(1);
    expect(transcription.turns[0]).toMatchObject({
      speakerId: "s-1",
      speakerNo: -1,
      text: "Chunk con speaker negativo",
    });
  });

  it("builds the default title by removing only a known final media extension", () => {
    const doc: ASRDocument = {
      document_id: "doc-title",
      document: [],
      speaker_turns: [],
    };
    const dottedFile = new File(["audio"], "audiencia.29.06.final.MP3", {
      type: "audio/mpeg",
    });
    const videoFile = new File(["video"], "audiencia.video.final.MP4", {
      type: "video/mp4",
    });
    const unknownExtensionFile = new File(["audio"], "audiencia.final.backup", {
      type: "application/octet-stream",
    });

    expect(
      mapASRDocumentToTranscription(doc, dottedFile, "blob:audio").title,
    ).toBe("audiencia.29.06.final");
    expect(
      mapASRDocumentToTranscription(doc, videoFile, "blob:video").title,
    ).toBe("audiencia.video.final");
    expect(
      mapASRDocumentToTranscription(doc, unknownExtensionFile, "blob:audio")
        .title,
    ).toBe("audiencia.final.backup");
  });

  it("falls back to the filename when backend title is blank", () => {
    const doc: ASRDocument = {
      document_id: "doc-blank-title",
      title: "   ",
      document: [],
      speaker_turns: [],
    };

    const transcription = mapASRDocumentToTranscription(
      doc,
      audioFile,
      "blob:audio",
    );

    expect(transcription.title).toBe("audiencia.29.06.final");
  });
});
