import type { RecomendacionValues } from "@/types/recomendaciones";
import { describe, expect, it } from "vitest";
import { RECOMENDACIONES_COLUMNS, toExcelRow } from "./to-excel-rows";

const values: RecomendacionValues = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: "30 de mayo de 2022",
  destinatarios: [
    {
      id: "a",
      nombre: "Ana Pérez",
      cargo: "Directora General",
      destinatario_principal: true,
      sector: "GCBA",
    },
    {
      id: "b",
      nombre: "Juan Gómez",
      cargo: "Subsecretario",
      destinatario_principal: false,
      sector: "Empresa",
    },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Resumen.",
};

const input = {
  values,
  documentId: "d1",
  fileName: "rec.pdf",
  validatedAt: "2026-07-31",
};

describe("toExcelRow", () => {
  it("promotes the first principal destinatario to its own columns", () => {
    const row = toExcelRow(input);
    expect(row.DESTINATARIO_PRINCIPAL_NOMBRE).toBe("Ana Pérez");
    expect(row.DESTINATARIO_PRINCIPAL_CARGO).toBe("Directora General");
    expect(row.DESTINATARIO_PRINCIPAL_SECTOR).toBe("GCBA");
  });

  it("flattens every destinatario into one pipe-separated column", () => {
    expect(toExcelRow(input).DESTINATARIOS).toBe(
      "Ana Pérez — Directora General (GCBA) [principal] | Juan Gómez — Subsecretario (Empresa)",
    );
  });

  it("renders booleans as si/no and counts destinatarios", () => {
    expect(toExcelRow(input).DATOS_PERSONALES).toBe("si");
    expect(toExcelRow(input).CANTIDAD_DESTINATARIOS).toBe(2);
  });

  it("carries the identity columns", () => {
    expect(toExcelRow(input)).toMatchObject({
      DOCUMENT_ID: "d1",
      DOCUMENTO: "rec.pdf",
      FECHA_VALIDACION: "2026-07-31",
    });
  });

  it("leaves the principal columns empty when there is no principal", () => {
    const none = {
      ...input,
      values: {
        ...values,
        destinatarios: values.destinatarios.map((d) => ({
          ...d,
          destinatario_principal: false,
        })),
      },
    };
    expect(toExcelRow(none).DESTINATARIO_PRINCIPAL_NOMBRE).toBe("");
    expect(toExcelRow(none).DESTINATARIOS).toBe(
      "Ana Pérez — Directora General (GCBA) | Juan Gómez — Subsecretario (Empresa)",
    );
  });

  it("emits exactly one key per declared column", () => {
    expect(Object.keys(toExcelRow(input)).sort()).toEqual(
      [...RECOMENDACIONES_COLUMNS].sort(),
    );
  });
});
