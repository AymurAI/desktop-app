import type {
  DestinatarioValue,
  RecomendacionValues,
} from "@/types/recomendaciones";

/**
 * Columnas de la hoja `recomendaciones`, una fila por recomendación. Definidas
 * una sola vez y documentadas como contrato: cuando exista un backend que
 * exporte la misma base, debe compartir este mismo orden de columnas.
 */
export const RECOMENDACIONES_COLUMNS = [
  "NUMERO_RECOMENDACION",
  "FECHA_RECOMENDACION",
  "TEMA",
  "SUBTEMA",
  "DATOS_PERSONALES", // "si" | "no"
  "CONTENIDO_PARA_PUBLICAR",
  "DESTINATARIO_PRINCIPAL_NOMBRE", // primer principal
  "DESTINATARIO_PRINCIPAL_CARGO",
  "DESTINATARIO_PRINCIPAL_SECTOR",
  "DESTINATARIOS", // todos, "nombre — cargo (sector) [principal]" unidos por " | "
  "CANTIDAD_DESTINATARIOS",
  "DOCUMENTO", // nombre de archivo
  "DOCUMENT_ID", // UUID5, clave de deduplicación
  "FECHA_VALIDACION", // ISO date local
] as const;

interface ToExcelRowInput {
  values: RecomendacionValues;
  documentId: string;
  fileName: string;
  validatedAt: string;
}

function formatDestinatario(destinatario: DestinatarioValue) {
  const base = `${destinatario.nombre} — ${destinatario.cargo} (${destinatario.sector})`;
  return destinatario.destinatario_principal ? `${base} [principal]` : base;
}

/**
 * Construye la fila de la hoja `recomendaciones` para un documento validado.
 * Pura y sin dependencias de reloj: `validatedAt` viaja como parámetro para
 * que el llamador decida el timestamp (mantiene la función testeable).
 */
export function toExcelRow({
  values,
  documentId,
  fileName,
  validatedAt,
}: ToExcelRowInput): Record<string, string | number> {
  const principal = values.destinatarios.find(
    (destinatario) => destinatario.destinatario_principal,
  );

  return {
    NUMERO_RECOMENDACION: values.numero_recomendacion,
    FECHA_RECOMENDACION: values.fecha_recomendacion,
    TEMA: values.tema,
    SUBTEMA: values.subtema,
    DATOS_PERSONALES: values.datos_personales ? "si" : "no",
    CONTENIDO_PARA_PUBLICAR: values.contenido_para_publicar,
    DESTINATARIO_PRINCIPAL_NOMBRE: principal?.nombre ?? "",
    DESTINATARIO_PRINCIPAL_CARGO: principal?.cargo ?? "",
    DESTINATARIO_PRINCIPAL_SECTOR: principal?.sector ?? "",
    DESTINATARIOS: values.destinatarios.map(formatDestinatario).join(" | "),
    CANTIDAD_DESTINATARIOS: values.destinatarios.length,
    DOCUMENTO: fileName,
    DOCUMENT_ID: documentId,
    FECHA_VALIDACION: validatedAt,
  };
}
