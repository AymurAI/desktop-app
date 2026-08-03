import filesystem from "@/services/filesystem";
import { ensureRecomendacionesSheet } from "@/services/filesystem/excel/recomendaciones-sheet";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { toExcelRow } from "./to-excel-rows";

interface SubmitRecomendacionInput {
  values: RecomendacionValues;
  documentId: string;
  fileName: string;
  validatedAt: string;
}

/**
 * Persiste una recomendación validada en la hoja `recomendaciones` del
 * workbook compartido. Upsert por `DOCUMENT_ID`: re-validar el mismo
 * documento reemplaza su fila en vez de duplicarla (a diferencia de
 * `offline.ts`, que hace `addRows` a ciegas para el Set de Datos).
 */
export async function submitRecomendacion(
  input: SubmitRecomendacionInput,
): Promise<void> {
  const workbook = (await filesystem.excel.read()) ?? filesystem.excel.create();
  const sheet = ensureRecomendacionesSheet(workbook);
  const row = toExcelRow(input);

  let existingRowNumber: number | null = null;
  sheet.eachRow((currentRow, rowNumber) => {
    if (rowNumber === 1) return;
    if (currentRow.getCell("DOCUMENT_ID").value === input.documentId) {
      existingRowNumber = rowNumber;
    }
  });

  if (existingRowNumber !== null) {
    const existingRow = sheet.getRow(existingRowNumber);
    for (const key of Object.keys(row)) {
      existingRow.getCell(key).value = row[key];
    }
    existingRow.commit();
  } else {
    sheet.addRow(row);
  }

  await filesystem.excel.write(workbook);
}
