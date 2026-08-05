import { describe, expect, it } from "vitest";

import { TAXONOMY } from "@/constants/recomendaciones/taxonomy";
import { dataExtractionResultSchema } from "@/schema/recomendaciones";
import {
  mockDataExtractionResult,
  mockDocumentExtract,
} from "./recomendaciones.mock";

describe("mockDataExtractionResult", () => {
  it("passes the same schema a real /llm/data-extraction response would", () => {
    const result = dataExtractionResultSchema.parse(mockDataExtractionResult());
    expect(result.numero_recomendacion).toBe("1440/22");
  });

  it("uses a tema/subtema pair that genuinely exists in the taxonomy", () => {
    const { tema, subtema } = mockDataExtractionResult();
    expect(tema).not.toBeNull();
    expect(subtema).not.toBeNull();
    expect(TAXONOMY).toHaveProperty(tema as string);
    expect(TAXONOMY[tema as string]).toContain(subtema);
  });

  it("has a destinatario_principal GCBA destinatario", () => {
    const { destinatarios } = mockDataExtractionResult();
    const principal = destinatarios.find((d) => d.destinatario_principal);
    expect(principal?.sector).toBe("GCBA");
    expect(principal?.nombre).toBe("María Rodríguez");
    expect(principal?.cargo).toBe("Directora General de Salud Pública");
  });

  it("has a non-principal second destinatario", () => {
    const { destinatarios } = mockDataExtractionResult();
    expect(destinatarios).toHaveLength(2);
    expect(destinatarios[1].destinatario_principal).toBe(false);
  });

  it("every locatable field appears verbatim in the mocked document paragraphs, so highlighting has something to find", () => {
    const result = mockDataExtractionResult();
    const document = mockDocumentExtract();
    const haystack = document.document.join("\n");

    expect(haystack).toContain(result.numero_recomendacion as string);
    expect(haystack).toContain(result.fecha_recomendacion as string);
    for (const destinatario of result.destinatarios) {
      expect(haystack).toContain(destinatario.nombre as string);
      expect(haystack).toContain(destinatario.cargo as string);
    }
  });
});
