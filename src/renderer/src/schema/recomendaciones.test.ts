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
      candidatos_nombre: [
        {
          nombre: "Valeria R. Focaraccio",
          cargo: "Directora General de Fiscalización Urbana",
          sigla: "DGFU",
          depende_de_cargo: null,
          ruta_cargos: "MEPHU > SSMU > DGFU",
          score: 0.91,
        },
      ],
      candidatos_cargo: [],
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
    expect(parsed.destinatarios[0].candidatos_nombre[0].sigla).toBe("DGFU");
  });

  it("defaults the candidate lists to empty arrays when absent", () => {
    const parsed = dataExtractionResultSchema.parse({
      ...FIXTURE,
      destinatarios: [
        {
          nombre: null,
          cargo: null,
          destinatario_principal: false,
          sector: null,
        },
      ],
    });
    expect(parsed.destinatarios[0].candidatos_nombre).toEqual([]);
    expect(parsed.destinatarios[0].candidatos_cargo).toEqual([]);
  });

  it("defaults destinatarios to an empty array", () => {
    const { destinatarios, ...rest } = FIXTURE;
    expect(dataExtractionResultSchema.parse(rest).destinatarios).toEqual([]);
  });
});

describe("recomendacionValidationSchema", () => {
  it("omits the candidate lists from destinatarios", () => {
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
    expect(parsed.destinatarios[0]).not.toHaveProperty("candidatos_nombre");
    expect(parsed.destinatarios[0]).not.toHaveProperty("candidatos_cargo");
  });
});

// §I2: these four fields were the only ones without a `.default()` in an
// otherwise fail-soft flow, so a backend omitting any single one made the
// WHOLE extraction throw — and `sigla` is never read by the frontend at all.
describe("dataExtractionResultSchema fail-soft defaults (§I2)", () => {
  it("defaults datos_personales to null and contenido_para_publicar to an empty string", () => {
    const { datos_personales, contenido_para_publicar, ...rest } = FIXTURE;
    const parsed = dataExtractionResultSchema.parse(rest);
    expect(parsed.datos_personales).toBeNull();
    expect(parsed.contenido_para_publicar).toBe("");
  });

  it("defaults a destinatario's destinatario_principal to false and a candidate's sigla to an empty string", () => {
    const parsed = dataExtractionResultSchema.parse({
      ...FIXTURE,
      destinatarios: [
        {
          nombre: "Sin principal",
          cargo: null,
          sector: null,
          candidatos_nombre: [
            {
              nombre: "X",
              cargo: "Y",
              ruta_cargos: "Z",
              score: 0.5,
            },
          ],
        },
      ],
    });
    expect(parsed.destinatarios[0].destinatario_principal).toBe(false);
    expect(parsed.destinatarios[0].candidatos_nombre[0].sigla).toBe("");
  });
});
