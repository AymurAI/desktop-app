import { z } from "zod";

export const ASRParagraphSchema = z.object({
  speaker_no: z.number().int(),
  start: z.union([z.string(), z.number()]),
  end: z.union([z.string(), z.number()]),
  text: z.string(),
  paragraph_id: z.string().optional(),
});

export const ASRDocumentSchema = z.object({
  document_id: z.string(),
  document: z.array(ASRParagraphSchema),
});

// The transcription backend streams Server-Sent Events as a discriminated union
// on `type`. A run looks like:
//   meta      → once, up front: the document id + audio duration (seconds)
//   delta     → many: incremental partial-text chunks with a 0..1 progress ratio
//   segments  → once, near the end: the authoritative paragraph array
//   done      → once: terminal marker (progress 1.0)
export const ASRMetaEventSchema = z.object({
  type: z.literal("meta"),
  document_id: z.string(),
  duration: z.number(),
});

export const ASRDeltaEventSchema = z.object({
  type: z.literal("delta"),
  text: z.string(),
  progress: z.number(),
});

export const ASRSegmentsEventSchema = z.object({
  type: z.literal("segments"),
  document: z.array(ASRParagraphSchema),
});

export const ASRDoneEventSchema = z.object({
  type: z.literal("done"),
  progress: z.number(),
});

export const ASRStreamEventSchema = z.discriminatedUnion("type", [
  ASRMetaEventSchema,
  ASRDeltaEventSchema,
  ASRSegmentsEventSchema,
  ASRDoneEventSchema,
]);

export type ASRParagraph = z.infer<typeof ASRParagraphSchema>;
export type ASRDocument = z.infer<typeof ASRDocumentSchema>;
export type ASRStreamEvent = z.infer<typeof ASRStreamEventSchema>;
