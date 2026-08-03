import type { DataExtractionResult } from "@/types/recomendaciones";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  normalizeExtraction,
  toValidationPayload,
  useRecomendacionForm,
} from "./useRecomendacionForm";

const RESULT: DataExtractionResult = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: null,
  destinatarios: [
    {
      nombre: "Ana Pérez",
      cargo: null,
      destinatario_principal: true,
      sector: "GCBA",
      candidatos_nombre: [
        {
          nombre: "Ana Perez",
          cargo: "DG",
          sigla: "DG",
          depende_de_cargo: null,
          ruta_cargos: "A>DG",
          score: 0.9,
        },
      ],
      candidatos_cargo: [],
    },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Resumen.",
};

const state = () => {
  const { values, candidates } = normalizeExtraction(RESULT);
  return {
    documentId: "d1",
    origin: "inference" as const,
    inference: RESULT,
    suggestions: values,
    values,
    candidates,
  };
};

describe("normalizeExtraction", () => {
  it("maps nulls to empty strings and assigns stable destinatario ids", () => {
    const { values } = normalizeExtraction(RESULT);
    expect(values.fecha_recomendacion).toBe("");
    expect(values.destinatarios[0].cargo).toBe("");
    expect(values.destinatarios[0].id).toMatch(/[0-9a-f-]{36}/);
  });

  it("indexes candidates by destinatario id", () => {
    const { values, candidates } = normalizeExtraction(RESULT);
    expect(candidates[values.destinatarios[0].id].nombre).toHaveLength(1);
    expect(candidates[values.destinatarios[0].id].cargo).toEqual([]);
  });

  it("seeds one empty destinatario when the LLM returned none", () => {
    const { values } = normalizeExtraction({ ...RESULT, destinatarios: [] });
    expect(values.destinatarios).toHaveLength(1);
    expect(values.destinatarios[0].nombre).toBe("");
  });
});

describe("useRecomendacionForm", () => {
  it("clears subtema when tema changes to one that does not contain it", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    act(() => result.current.setField("tema", "COMUNICACIONES"));
    expect(result.current.values.subtema).toBe("");
  });

  it("keeps subtema when it is still valid under the new tema", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    act(() => result.current.setField("subtema", "Inundaciones"));
    act(() => result.current.setField("tema", "AMBIENTE y CAMBIO CLIMÁTICO"));
    expect(result.current.values.subtema).toBe("Inundaciones");
  });

  it("adds and removes destinatarios, keeping at least one", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    let created = "";
    act(() => {
      created = result.current.addDestinatario();
    });
    expect(result.current.values.destinatarios).toHaveLength(2);
    act(() => result.current.removeDestinatario(created));
    expect(result.current.values.destinatarios).toHaveLength(1);
    act(() =>
      result.current.removeDestinatario(
        result.current.values.destinatarios[0].id,
      ),
    );
    expect(result.current.values.destinatarios).toHaveLength(1);
  });

  it("reports pristine fields against the frozen suggestions", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    expect(result.current.isPristine("numero_recomendacion")).toBe(true);
    act(() => result.current.setField("numero_recomendacion", "9/25"));
    expect(result.current.isPristine("numero_recomendacion")).toBe(false);
  });

  it("keeps suggestions frozen to the original inference after edits", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    const originalNumero = result.current.suggestions.numero_recomendacion;
    const originalDestinatarioNombre =
      result.current.suggestions.destinatarios[0].nombre;
    const destinatarioId = result.current.values.destinatarios[0].id;

    act(() => result.current.setField("numero_recomendacion", "9/25"));
    act(() =>
      result.current.setDestinatarioField(
        destinatarioId,
        "nombre",
        "Otro Nombre",
      ),
    );

    expect(result.current.suggestions.numero_recomendacion).toBe(
      originalNumero,
    );
    expect(result.current.suggestions.destinatarios[0].nombre).toBe(
      originalDestinatarioNombre,
    );
    expect(result.current.values.numero_recomendacion).toBe("9/25");
    expect(result.current.values.destinatarios[0].nombre).toBe("Otro Nombre");
  });
});

describe("toValidationPayload", () => {
  it("strips local ids and candidate lists", () => {
    const { values } = normalizeExtraction(RESULT);
    const payload = toValidationPayload(values);
    expect(payload.destinatarios[0]).toEqual({
      nombre: "Ana Pérez",
      cargo: "",
      destinatario_principal: true,
      sector: "GCBA",
    });
  });

  // Controller ruling / §M8: `datos_personales` is `boolean | null`, where
  // `null` means "unanswered". Coercing it to `false` on the way out would
  // persist an explicit "No" the user never gave.
  it("passes an unanswered datos_personales through as null instead of coercing it to false", () => {
    const { values } = normalizeExtraction(RESULT);
    expect(
      toValidationPayload({ ...values, datos_personales: null })
        .datos_personales,
    ).toBeNull();
    expect(
      toValidationPayload({ ...values, datos_personales: false })
        .datos_personales,
    ).toBe(false);
    expect(
      toValidationPayload({ ...values, datos_personales: true })
        .datos_personales,
    ).toBe(true);
  });
});
