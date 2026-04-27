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

export const ASRStreamEventSchema = z.object({
  document_id: z.string(),
  document: z.array(ASRParagraphSchema),
  current_time: z.number().nullable(),
  total_time: z.number(),
});

export type ASRParagraph = z.infer<typeof ASRParagraphSchema>;
export type ASRDocument = z.infer<typeof ASRDocumentSchema>;
export type ASRStreamEvent = z.infer<typeof ASRStreamEventSchema>;
