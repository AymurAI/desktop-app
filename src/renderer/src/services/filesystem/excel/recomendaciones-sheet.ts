import { RECOMENDACIONES_COLUMNS } from "@/utils/recomendaciones/to-excel-rows";
import type { Workbook, Worksheet } from "exceljs";

export const RECOMENDACIONES_SHEET = "recomendaciones";

/**
 * Devuelve la hoja de recomendaciones del workbook compartido, creándola con
 * su header si todavía no existe. Idempotente: llamarla sobre un workbook que
 * ya la tiene no la reescribe ni duplica columnas.
 */
export function ensureRecomendacionesSheet(workbook: Workbook): Worksheet {
  const existing = workbook.getWorksheet(RECOMENDACIONES_SHEET);
  if (existing) return existing;

  const worksheet = workbook.addWorksheet(RECOMENDACIONES_SHEET, {
    properties: { tabColor: { argb: "FFE0B2" } },
  });
  worksheet.columns = RECOMENDACIONES_COLUMNS.map((label) => ({
    header: label,
    key: label,
  }));
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0B2" },
    };
  });
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  return worksheet;
}
