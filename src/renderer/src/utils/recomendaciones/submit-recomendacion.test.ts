import { RECOMENDACIONES_SHEET } from "@/services/filesystem/excel/recomendaciones-sheet";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { Workbook } from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readMock = vi.fn();
const createMock = vi.fn();
const writeMock = vi.fn();

vi.mock("@/services/filesystem", () => ({
  default: {
    excel: {
      read: (...args: unknown[]) => readMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      write: (...args: unknown[]) => writeMock(...args),
    },
  },
}));

import { submitRecomendacion } from "./submit-recomendacion";

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
  ],
  tema: "AMBIENTE",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Resumen.",
};

function baseInput(documentId: string) {
  return {
    values,
    documentId,
    fileName: "rec.pdf",
    validatedAt: "2026-07-31",
  };
}

describe("submitRecomendacion", () => {
  beforeEach(() => {
    readMock.mockReset();
    createMock.mockReset();
    writeMock.mockReset();
  });

  it("inserts a new row when the DOCUMENT_ID is new", async () => {
    const workbook = new Workbook();
    readMock.mockResolvedValue(workbook);

    await submitRecomendacion(baseInput("d1"));

    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    expect(sheet?.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
    expect(writeMock).toHaveBeenCalledWith(workbook);
  });

  it("replaces instead of duplicating when the DOCUMENT_ID already exists", async () => {
    const workbook = new Workbook();
    readMock.mockResolvedValue(workbook);

    await submitRecomendacion(baseInput("d1"));
    await submitRecomendacion({
      ...baseInput("d1"),
      values: { ...values, numero_recomendacion: "9999/22" },
    });

    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    const dataRows = sheet ? sheet.rowCount - 1 : 0;
    expect(dataRows).toBe(1);
    expect(sheet?.getRow(2).getCell("NUMERO_RECOMENDACION").value).toBe(
      "9999/22",
    );
  });

  it("creates the sheet when the workbook only had set_de_datos", async () => {
    const workbook = new Workbook();
    workbook.addWorksheet("set_de_datos");
    readMock.mockResolvedValue(workbook);

    await submitRecomendacion(baseInput("d1"));

    expect(workbook.worksheets.map((w) => w.name)).toEqual([
      "set_de_datos",
      RECOMENDACIONES_SHEET,
    ]);
  });
});
