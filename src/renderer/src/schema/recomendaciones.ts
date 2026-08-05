import z from "zod";

const destinatarioExtractionSchema = z.object({
  nombre: z.string().nullable().default(null),
  cargo: z.string().nullable().default(null),
  destinatario_principal: z.boolean().default(false),
  sector: z.string().nullable().default(null),
});

export const dataExtractionResultSchema = z.object({
  numero_recomendacion: z.string().nullable().default(null),
  fecha_recomendacion: z.string().nullable().default(null),
  destinatarios: z.array(destinatarioExtractionSchema).default([]),
  tema: z.string().nullable().default(null),
  subtema: z.string().nullable().default(null),
  // `null` means "unanswered" and must stay distinguishable from an explicit
  // "No" all the way to the exported .xlsx (see `formatDatosPersonales`).
  datos_personales: z.boolean().nullable().default(null),
  contenido_para_publicar: z.string().default(""),
});

/** Lo que se persiste como validación manual. */
export const recomendacionValidationSchema = dataExtractionResultSchema;

export const recomendacionDocumentSchema = z.object({
  document_id: z.string(),
  prediction: dataExtractionResultSchema.nullable().default(null),
  validation: recomendacionValidationSchema.nullable().default(null),
  updated_at: z.string().nullable().default(null),
});

export type RecomendacionValidation = z.infer<
  typeof recomendacionValidationSchema
>;
export type RecomendacionDocument = z.infer<typeof recomendacionDocumentSchema>;
