import z from "zod";

export const organigramCandidateSchema = z.object({
  nombre: z.string(),
  cargo: z.string(),
  sigla: z.string(),
  depende_de_cargo: z.string().nullable().default(null),
  ruta_cargos: z.string(),
  score: z.number(),
});

export const destinatarioExtractionSchema = z.object({
  nombre: z.string().nullable().default(null),
  cargo: z.string().nullable().default(null),
  destinatario_principal: z.boolean(),
  sector: z.string().nullable().default(null),
  candidatos_nombre: z.array(organigramCandidateSchema).default([]),
  candidatos_cargo: z.array(organigramCandidateSchema).default([]),
});

export const dataExtractionResultSchema = z.object({
  numero_recomendacion: z.string().nullable().default(null),
  fecha_recomendacion: z.string().nullable().default(null),
  destinatarios: z.array(destinatarioExtractionSchema).default([]),
  tema: z.string().nullable().default(null),
  subtema: z.string().nullable().default(null),
  datos_personales: z.boolean(),
  contenido_para_publicar: z.string(),
});

/** Lo que se persiste como validación manual: el resultado sin los candidatos. */
export const recomendacionValidationSchema = dataExtractionResultSchema.extend({
  destinatarios: z.array(
    destinatarioExtractionSchema.omit({
      candidatos_nombre: true,
      candidatos_cargo: true,
    }),
  ),
});

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
