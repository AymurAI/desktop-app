import {
  RECOMENDACIONES_SHEET,
  ensureRecomendacionesSheet,
} from "@/services/filesystem/excel/recomendaciones-sheet";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { Workbook } from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A faithful in-memory stand-in for the real `filesystem.excel` service.
// Production `read()` does `workbook.xlsx.load(buffer)` on every call — a
// FRESH Workbook parsed from bytes, never the same live object `write()` was
// given. A mock that instead does `readMock.mockResolvedValue(sameWorkbook)`
// hands back the identical in-memory object across calls, which papers over
// exactly the bug this suite exists to catch: exceljs column `key`s are an
// in-memory-only alias, never serialised into the .xlsx, so a sheet that
// survived a real read/write round-trip loses `key`-based cell access
// entirely. This "disk" is a Buffer, and every `read()` re-parses it, so the
// mock exercises the same hazard the real service does.
type DiskBuffer = Awaited<ReturnType<Workbook["xlsx"]["writeBuffer"]>>;
let disk: DiskBuffer | null = null;

async function fakeRead() {
  if (!disk) return null;
  const workbook = new Workbook();
  await workbook.xlsx.load(disk);
  return workbook;
}

async function fakeWrite(workbook: Workbook) {
  disk = await workbook.xlsx.writeBuffer();
}

function fakeCreate() {
  return new Workbook();
}

const readMock = vi.fn(fakeRead);
const createMock = vi.fn(fakeCreate);
const writeMock = vi.fn(fakeWrite);

vi.mock("@/services/filesystem", () => ({
  default: {
    excel: {
      read: (...args: unknown[]) => readMock(...(args as [])),
      create: (...args: unknown[]) => createMock(...(args as [])),
      write: (...args: unknown[]) => writeMock(...(args as [Workbook])),
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

/**
 * Reads back whatever is currently on the fake disk, for assertions.
 * `ensureRecomendacionesSheet` re-attaches the sheet's column `key`s the same
 * way any real consumer re-opening the workbook would (it's the only
 * supported way to get key-addressed cell access on a sheet loaded from
 * disk) — assertions below deliberately go through it rather than around it.
 */
async function readDisk() {
  const workbook = new Workbook();
  if (!disk) throw new Error("readDisk: nothing written yet");
  await workbook.xlsx.load(disk);
  if (workbook.getWorksheet(RECOMENDACIONES_SHEET)) {
    ensureRecomendacionesSheet(workbook);
  }
  return workbook;
}

describe("submitRecomendacion", () => {
  beforeEach(() => {
    disk = null;
    readMock.mockClear();
    createMock.mockClear();
    writeMock.mockClear();
  });

  it("inserts a new row when the DOCUMENT_ID is new", async () => {
    await submitRecomendacion(baseInput("d1"));

    const workbook = await readDisk();
    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    expect(sheet?.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
  });

  it("replaces instead of duplicating when the DOCUMENT_ID already exists", async () => {
    await submitRecomendacion(baseInput("d1"));
    await submitRecomendacion({
      ...baseInput("d1"),
      values: { ...values, numero_recomendacion: "9999/22" },
    });

    const workbook = await readDisk();
    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    const dataRows = sheet ? sheet.rowCount - 1 : 0;
    expect(dataRows).toBe(1);
    expect(sheet?.getRow(2).getCell("NUMERO_RECOMENDACION").value).toBe(
      "9999/22",
    );
  });

  it("creates the sheet when the workbook only had set_de_datos", async () => {
    const seed = new Workbook();
    seed.addWorksheet("set_de_datos");
    disk = await seed.xlsx.writeBuffer();

    await submitRecomendacion(baseInput("d1"));

    const workbook = await readDisk();
    expect(workbook.worksheets.map((w) => w.name)).toEqual([
      "set_de_datos",
      RECOMENDACIONES_SHEET,
    ]);
  });

  it("starts a brand-new workbook via create() when read() resolves null (no .xlsx yet)", async () => {
    expect(disk).toBeNull();

    await submitRecomendacion(baseInput("d1"));

    expect(createMock).toHaveBeenCalledTimes(1);
    const workbook = await readDisk();
    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    expect(sheet?.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
  });

  it("survives a real read/write round-trip across two different documents (regression for exceljs key aliasing)", async () => {
    // Submitting a first document writes it, then a real Buffer round-trip
    // (via `disk`) is what a second submission's `read()` sees — exactly the
    // path that threw "Out of bounds" before `ensureRecomendacionesSheet`
    // re-attached column keys on the existing-sheet branch.
    await submitRecomendacion(baseInput("d1"));
    await submitRecomendacion({
      ...baseInput("d2"),
      values: { ...values, numero_recomendacion: "2222/22" },
    });

    const workbook = await readDisk();
    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    expect(sheet?.rowCount).toBe(3); // header + 2 data rows
    expect(sheet?.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
    expect(sheet?.getRow(3).getCell("DOCUMENT_ID").value).toBe("d2");
    expect(sheet?.getRow(3).getCell("NUMERO_RECOMENDACION").value).toBe(
      "2222/22",
    );
  });

  it("upserts the same document across a real read/write round-trip (regression for exceljs key aliasing)", async () => {
    await submitRecomendacion(baseInput("d1"));
    await submitRecomendacion({
      ...baseInput("d1"),
      values: { ...values, numero_recomendacion: "9999/22" },
    });

    const workbook = await readDisk();
    const sheet = workbook.getWorksheet(RECOMENDACIONES_SHEET);
    const dataRows = sheet ? sheet.rowCount - 1 : 0;
    expect(dataRows).toBe(1);
    expect(sheet?.getRow(2).getCell("NUMERO_RECOMENDACION").value).toBe(
      "9999/22",
    );
  });

  it("leaves set_de_datos rows untouched by submitRecomendacion", async () => {
    const seed = new Workbook();
    const datasetSheet = seed.addWorksheet("set_de_datos");
    datasetSheet.addRow(["already", "here"]);
    disk = await seed.xlsx.writeBuffer();

    await submitRecomendacion(baseInput("d1"));

    const workbook = await readDisk();
    const datasetAfter = workbook.getWorksheet("set_de_datos");
    expect(datasetAfter?.rowCount).toBe(1);
    expect(datasetAfter?.getRow(1).getCell(1).value).toBe("already");
    expect(datasetAfter?.getRow(1).getCell(2).value).toBe("here");
  });
});
