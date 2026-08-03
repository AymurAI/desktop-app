import { RECOMENDACIONES_COLUMNS } from "@/utils/recomendaciones/to-excel-rows";
import { Workbook } from "exceljs";
import { describe, expect, it } from "vitest";
import {
  RECOMENDACIONES_SHEET,
  ensureRecomendacionesSheet,
} from "./recomendaciones-sheet";

describe("ensureRecomendacionesSheet", () => {
  it("creates the sheet with the declared header on a bare workbook", () => {
    const sheet = ensureRecomendacionesSheet(new Workbook());
    expect(sheet.name).toBe(RECOMENDACIONES_SHEET);
    expect(sheet.columns.map((c) => c.key)).toEqual([
      ...RECOMENDACIONES_COLUMNS,
    ]);
  });

  it("is idempotent and preserves existing rows", () => {
    const workbook = new Workbook();
    ensureRecomendacionesSheet(workbook).addRow({ DOCUMENT_ID: "d1" });
    const again = ensureRecomendacionesSheet(workbook);
    expect(
      workbook.worksheets.filter((w) => w.name === RECOMENDACIONES_SHEET),
    ).toHaveLength(1);
    expect(again.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
  });

  it("coexists with the set_de_datos sheet in the same workbook", () => {
    const workbook = new Workbook();
    workbook.addWorksheet("set_de_datos");
    ensureRecomendacionesSheet(workbook);
    expect(workbook.worksheets.map((w) => w.name)).toEqual([
      "set_de_datos",
      RECOMENDACIONES_SHEET,
    ]);
  });
});
