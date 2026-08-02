import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dispatchMock = vi.fn();
vi.mock("./useFiles", () => ({
  useFileDispatch: () => dispatchMock,
}));

const loadRecomendacionMock = vi.fn();
const extractRecomendacionMock = vi.fn();
vi.mock("@/services/aymurai/recomendaciones", () => ({
  loadRecomendacion: (...args: unknown[]) => loadRecomendacionMock(...args),
  extractRecomendacion: (...args: unknown[]) =>
    extractRecomendacionMock(...args),
}));

import { getContext } from "@/features/ReactQueryProvider";
import type { RecomendacionDocument } from "@/schema/recomendaciones";
import type { DocFile } from "@/types/file";
import type { DataExtractionResult } from "@/types/recomendaciones";
import { QueryClientProvider } from "@tanstack/react-query";

import { useDataExtraction } from "./useDataExtraction";

function makeFile(overrides: Partial<DocFile> = {}): DocFile {
  return {
    data: new File(["x"], "doc.pdf"),
    selected: true,
    validationObject: {},
    paragraphs: [{ id: "doc-1:0", value: "hola", document_id: "doc-1" }],
    ...overrides,
  };
}

function extraction(
  overrides: Partial<DataExtractionResult> = {},
): DataExtractionResult {
  return {
    numero_recomendacion: "1/24",
    fecha_recomendacion: "2024-01-01",
    destinatarios: [
      {
        nombre: "Original",
        cargo: "Cargo original",
        destinatario_principal: true,
        sector: "Sector original",
        candidatos_nombre: [
          {
            nombre: "Candidato",
            cargo: "Cargo candidato",
            sigla: "CC",
            depende_de_cargo: null,
            ruta_cargos: "ruta",
            score: 1,
          },
        ],
        candidatos_cargo: [],
      },
    ],
    tema: "Tema",
    subtema: "Subtema",
    datos_personales: false,
    contenido_para_publicar: "contenido",
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const { queryClient } = getContext();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  dispatchMock.mockReset();
  loadRecomendacionMock.mockReset();
  extractRecomendacionMock.mockReset();
});

describe("useDataExtraction", () => {
  it("idempotency guard: does nothing when file.recomendacion is already set", () => {
    const file = makeFile({
      recomendacion: { documentId: "doc-1", origin: "inference" } as never,
    });

    renderHook(() => useDataExtraction(file), { wrapper });

    expect(loadRecomendacionMock).not.toHaveBeenCalled();
    expect(extractRecomendacionMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("404/absent: calls extractRecomendacion; origin = inference", async () => {
    loadRecomendacionMock.mockResolvedValue(null);
    extractRecomendacionMock.mockResolvedValue(extraction());
    const file = makeFile();

    renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));

    expect(extractRecomendacionMock).toHaveBeenCalledWith("doc-1", ["hola"]);
    const recomendacion = dispatchMock.mock.calls[0][0].payload.recomendacion;
    expect(recomendacion.origin).toBe("inference");
    expect(recomendacion.values.numero_recomendacion).toBe("1/24");
  });

  it("validation != null: origin = validation; values from validation, suggestions from prediction", async () => {
    const prediction = extraction();
    const stored: RecomendacionDocument = {
      document_id: "doc-1",
      prediction,
      validation: {
        numero_recomendacion: "2/24",
        fecha_recomendacion: "2024-02-02",
        destinatarios: [
          {
            nombre: "Corregido",
            cargo: "Cargo corregido",
            destinatario_principal: true,
            sector: "Sector corregido",
          },
        ],
        tema: "TemaValidado",
        subtema: "SubtemaValidado",
        datos_personales: true,
        contenido_para_publicar: "contenido validado",
      },
      updated_at: "2024-02-02",
    };
    loadRecomendacionMock.mockResolvedValue(stored);
    const file = makeFile();

    renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));

    expect(extractRecomendacionMock).not.toHaveBeenCalled();
    const recomendacion = dispatchMock.mock.calls[0][0].payload.recomendacion;
    expect(recomendacion.origin).toBe("validation");

    // The user's corrections must be in `values`...
    expect(recomendacion.values.numero_recomendacion).toBe("2/24");
    expect(recomendacion.values.tema).toBe("TemaValidado");
    expect(recomendacion.values.destinatarios[0].nombre).toBe("Corregido");

    // ...while `suggestions` still show the ORIGINAL model output.
    expect(recomendacion.suggestions.numero_recomendacion).toBe("1/24");
    expect(recomendacion.suggestions.tema).toBe("Tema");
    expect(recomendacion.suggestions.destinatarios[0].nombre).toBe("Original");

    // Candidates come from the prediction when present.
    expect(
      recomendacion.candidates[recomendacion.values.destinatarios[0].id].nombre,
    ).toHaveLength(1);
  });

  it("validation == null, prediction != null: origin = stored-inference; suggestions = values = normalize(prediction)", async () => {
    const prediction = extraction();
    const stored: RecomendacionDocument = {
      document_id: "doc-1",
      prediction,
      validation: null,
      updated_at: null,
    };
    loadRecomendacionMock.mockResolvedValue(stored);
    const file = makeFile();

    renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));

    expect(extractRecomendacionMock).not.toHaveBeenCalled();
    const recomendacion = dispatchMock.mock.calls[0][0].payload.recomendacion;
    expect(recomendacion.origin).toBe("stored-inference");
    expect(recomendacion.values).toEqual(recomendacion.suggestions);
    expect(recomendacion.values.numero_recomendacion).toBe("1/24");
  });
});
