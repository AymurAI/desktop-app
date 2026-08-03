import type { DocumentExtract } from "@/schema/extract";
import type { DataExtractionResult } from "@/types/recomendaciones";

/**
 * Development aid for the Recomendaciones flow (`USE_MOCK_RECOMENDACIONES` in
 * `constants/config.ts`). Not used when the flag is off.
 *
 * Fixture values are deliberately realistic for a Defensoría del Pueblo de la
 * CABA recommendation, and `tema`/`subtema` are verified (see
 * `recomendaciones.mock.test.ts`) to exist verbatim in
 * `constants/recomendaciones/taxonomy.ts`.
 */

/** Stable fake document id, used by the mocked `fileParser` in `queries.ts`. */
const MOCK_DOCUMENT_ID = "550e8400-e29b-41d4-a716-446655440000";

/**
 * Fixture paragraphs for the mocked document parse. Contain, verbatim, the
 * `numero_recomendacion`, `fecha_recomendacion` and both destinatarios'
 * `nombre`/`cargo` from `mockDataExtractionResult`, so the validation
 * screen's exact-match highlighting has something to find instead of
 * silently falling through to fuzzy matching (or finding nothing at all).
 */
const MOCK_PARAGRAPHS: string[] = [
  "DEFENSORÍA DEL PUEBLO DE LA CIUDAD AUTÓNOMA DE BUENOS AIRES",
  "RECOMENDACIÓN N.º 1440/22",
  "Buenos Aires, 30 de Mayo de 2022.",
  "VISTO: la actuación n.º 8123/22 iniciada por reclamos vecinales vinculados a la demora en la provisión de vacunas en los centros de salud del barrio de Flores, y las constancias reunidas en el expediente;",
  "CONSIDERANDO: que del relevamiento efectuado surge que la situación denunciada se mantiene desde hace varios meses, afectando particularmente a personas mayores y a niñas y niños en edad escolar;",
  "Que corresponde dirigir la presente recomendación a María Rodríguez, en su carácter de Directora General de Salud Pública, por ser el área con competencia directa en la organización de la campaña de vacunación;",
  "Que asimismo corresponde notificar a Juan Pérez, Presidente de la Comuna 4, a los efectos de que preste colaboración territorial en la difusión de los turnos disponibles;",
  "Por ello, EL DEFENSOR DEL PUEBLO DE LA CIUDAD AUTÓNOMA DE BUENOS AIRES RESUELVE: recomendar a las autoridades mencionadas la adopción de las medidas necesarias para garantizar el acceso oportuno a la vacunación en el barrio de Flores.",
  "Regístrese, notifíquese y archívese.",
];

export function mockDocumentExtract(): DocumentExtract {
  return {
    document_id: MOCK_DOCUMENT_ID,
    header: null,
    footer: null,
    document: MOCK_PARAGRAPHS,
  };
}

export function mockDataExtractionResult(): DataExtractionResult {
  return {
    numero_recomendacion: "1440/22",
    fecha_recomendacion: "30 de Mayo de 2022",
    destinatarios: [
      {
        nombre: "María Rodríguez",
        cargo: "Directora General de Salud Pública",
        destinatario_principal: true,
        sector: "GCBA",
        candidatos_nombre: [
          {
            nombre: "María Rodríguez",
            cargo: "Directora General de Salud Pública",
            sigla: "DGSP",
            depende_de_cargo: "Ministerio de Salud",
            ruta_cargos:
              "Ministerio de Salud > Dirección General de Salud Pública",
            score: 0.94,
          },
          {
            nombre: "María Rodríguez",
            cargo: "Directora General Adjunta de Salud Pública",
            sigla: "DGASP",
            depende_de_cargo: "Dirección General de Salud Pública",
            ruta_cargos:
              "Ministerio de Salud > Dirección General de Salud Pública > Dirección General Adjunta de Salud Pública",
            score: 0.61,
          },
        ],
        candidatos_cargo: [
          {
            nombre: "María Rodríguez",
            cargo: "Directora General de Salud Pública",
            sigla: "DGSP",
            depende_de_cargo: "Ministerio de Salud",
            ruta_cargos:
              "Ministerio de Salud > Dirección General de Salud Pública",
            score: 0.94,
          },
        ],
      },
      {
        nombre: "Juan Pérez",
        cargo: "Presidente de la Comuna 4",
        destinatario_principal: false,
        sector: null,
        candidatos_nombre: [],
        candidatos_cargo: [],
      },
    ],
    tema: "SALUD",
    subtema: "Vacunación",
    datos_personales: true,
    contenido_para_publicar:
      "Se recomienda a las autoridades del Ministerio de Salud del GCBA garantizar el acceso oportuno a la vacunación en el barrio de Flores. Se solicita además la colaboración de la Comuna 4 en la difusión territorial de los turnos disponibles.",
  };
}
