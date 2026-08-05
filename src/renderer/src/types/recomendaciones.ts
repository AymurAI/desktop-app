interface DestinatarioExtraction {
  nombre: string | null;
  cargo: string | null;
  destinatario_principal: boolean;
  sector: string | null;
}

/** Respuesta cruda de POST /llm/data-extraction. */
export interface DataExtractionResult {
  numero_recomendacion: string | null;
  fecha_recomendacion: string | null;
  destinatarios: DestinatarioExtraction[];
  tema: string | null;
  subtema: string | null;
  /** `null` = sin responder; se conserva distinto de un "No" explícito. */
  datos_personales: boolean | null;
  contenido_para_publicar: string;
}

/** Un destinatario tal como lo edita el usuario. `id` es local y estable
 *  (crypto.randomUUID) para poder usarlo como key de React y de las tabs. */
export interface DestinatarioValue {
  id: string;
  nombre: string;
  cargo: string;
  destinatario_principal: boolean;
  sector: string;
}

/** Los valores editables del formulario. Strings vacíos, nunca null:
 *  TextField/Select son controlados y `null` rompería el binding. */
export interface RecomendacionValues {
  numero_recomendacion: string;
  fecha_recomendacion: string;
  destinatarios: DestinatarioValue[];
  tema: string;
  subtema: string;
  datos_personales: boolean | null;
  contenido_para_publicar: string;
}

/** Sugerencias = inferencia original congelada, en el mismo shape que los valores.
 *  Se conserva aparte para (a) alimentar `suggestion` de TextField/Select y
 *  (b) poder diffear inferencia vs validación al persistir. */
type RecomendacionSuggestions = RecomendacionValues;

type RecomendacionOrigin = "inference" | "stored-inference" | "validation";

export interface RecomendacionState {
  /** UUID5 del contenido del archivo, devuelto por /misc/document-extract. */
  documentId: string;
  origin: RecomendacionOrigin;
  /** Inferencia cruda. */
  inference: DataExtractionResult;
  suggestions: RecomendacionSuggestions;
  values: RecomendacionValues;
}
