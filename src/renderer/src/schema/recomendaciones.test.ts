import { describe, expect, it } from "vitest";
import {
  dataExtractionResultSchema,
  recomendacionValidationSchema,
} from "./recomendaciones";

const FIXTURE = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: "30 de Mayo de 2022",
  destinatarios: [
    {
      nombre: "Valeria Romina Focaraccio",
      cargo: "Directora General de Fiscalización Urbana",
      destinatario_principal: true,
      sector: "GCBA",
    },
  ],
  tema: "DERECHOS URBANOS, ESPACIO PÚBLICO Y CONTROL COMUNAL",
  subtema: "Cartelería y publicidad en vía pública",
  datos_personales: true,
  contenido_para_publicar:
    "Se recomienda el retiro de estructuras publicitarias.",
};

describe("dataExtractionResultSchema", () => {
  it("parses a full backend response", () => {
    const parsed = dataExtractionResultSchema.parse(FIXTURE);
    expect(parsed.destinatarios[0].nombre).toBe("Valeria Romina Focaraccio");
  });

  it("defaults destinatarios to an empty array", () => {
    const { destinatarios, ...rest } = FIXTURE;
    expect(dataExtractionResultSchema.parse(rest).destinatarios).toEqual([]);
  });
});

describe("recomendacionValidationSchema", () => {
  it("parses the same destinatario shape as the prediction schema", () => {
    const parsed = recomendacionValidationSchema.parse({
      ...FIXTURE,
      destinatarios: [
        {
          nombre: "Valeria Romina Focaraccio",
          cargo: "Directora General de Fiscalización Urbana",
          destinatario_principal: true,
          sector: "GCBA",
        },
      ],
    });
    expect(parsed.destinatarios[0]).toEqual({
      nombre: "Valeria Romina Focaraccio",
      cargo: "Directora General de Fiscalización Urbana",
      destinatario_principal: true,
      sector: "GCBA",
    });
  });
});

// §I2: these fields were the only ones without a `.default()` in an
// otherwise fail-soft flow, so a backend omitting any single one made the
// WHOLE extraction throw.
describe("dataExtractionResultSchema fail-soft defaults (§I2)", () => {
  it("defaults datos_personales to null and contenido_para_publicar to an empty string", () => {
    const { datos_personales, contenido_para_publicar, ...rest } = FIXTURE;
    const parsed = dataExtractionResultSchema.parse(rest);
    expect(parsed.datos_personales).toBeNull();
    expect(parsed.contenido_para_publicar).toBe("");
  });

  it("defaults a destinatario's destinatario_principal to false", () => {
    const parsed = dataExtractionResultSchema.parse({
      ...FIXTURE,
      destinatarios: [
        {
          nombre: "Sin principal",
          cargo: null,
          sector: null,
        },
      ],
    });
    expect(parsed.destinatarios[0].destinatario_principal).toBe(false);
  });
});
