import z from "zod";

export const documentExtractSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  paragraphs: z.array(
    z.object({
      id: z.string().uuid(),
      text: z.string(),
      hash: z.string(),
      index: z.number(),
      created_at: z.string().datetime({ local: true }),
      updated_at: z.string().datetime({ local: true }).nullable(),
    }),
  ),
});

export type DocumentExtract = z.infer<typeof documentExtractSchema>;
