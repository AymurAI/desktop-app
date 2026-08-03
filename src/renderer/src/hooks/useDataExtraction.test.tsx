import { act, renderHook, waitFor } from "@testing-library/react";
import { CanceledError } from "axios";
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
import api from "@/services/api";
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

// I1 relies on `renderHook(fn, { wrapper, reactStrictMode: true })` (below),
// NOT on manually nesting a `<StrictMode>` element inside `wrapper`. Verified
// empirically against this React 19 / @testing-library/react 16 combo: React
// only double-invokes a mount's effects (mount -> cleanup -> mount) when
// `<StrictMode>` is the literal root element under `createRoot` — nested one
// level inside an ordinary wrapper component (as `<StrictMode>{children}</StrictMode>`
// returned from `wrapper`), it silently does NOT double-invoke, and a test
// built that way would pass regardless of whether the latch it's meant to
// guard is even present. The `reactStrictMode` render option avoids this: it
// wraps `<StrictMode>` around the *entire* `wrapper(ui)` tree at the true
// root, which does reliably double-invoke.

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

    expect(extractRecomendacionMock).toHaveBeenCalledWith(
      "doc-1",
      ["hola"],
      expect.any(AbortSignal),
    );
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

  // I2(a): a re-thrown `CanceledError` from the GET must not leave the
  // screen stuck in "loading" forever with no way out.
  it("surfaces a GET failure (re-thrown CanceledError) as status = error, not a permanent loading state", async () => {
    loadRecomendacionMock.mockRejectedValue(new CanceledError());
    const file = makeFile();

    const { result } = renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(extractRecomendacionMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(CanceledError);
  });

  // I2(b): the schema allows a stored row with both `prediction` and
  // `validation` null. That must fall through to extraction, not hang.
  it("stored document with prediction = null AND validation = null: falls through to extraction", async () => {
    const stored: RecomendacionDocument = {
      document_id: "doc-1",
      prediction: null,
      validation: null,
      updated_at: null,
    };
    loadRecomendacionMock.mockResolvedValue(stored);
    extractRecomendacionMock.mockResolvedValue(extraction());
    const file = makeFile();

    renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));

    expect(extractRecomendacionMock).toHaveBeenCalledWith(
      "doc-1",
      ["hola"],
      expect.any(AbortSignal),
    );
    const recomendacion = dispatchMock.mock.calls[0][0].payload.recomendacion;
    expect(recomendacion.origin).toBe("inference");
  });

  // I1: the previous round fixed a duplicate-extraction hazard with a
  // synchronous ref latch (`extractionStartedForRef`), keyed by documentId,
  // instead of relying on `mutation.status` (a render snapshot that reads
  // "idle" on both invocations of a same-tick StrictMode double-effect).
  //
  // The hazard only manifests when the GET is ALREADY resolved and cached
  // (`staleTime: Infinity` + re-entering the process screen) at the moment of
  // mount, so `query.isSuccess` is `true` from the very first render — with a
  // fresh (uncached) GET, `query.isSuccess` only flips to `true` on a later
  // render, well after StrictMode's mount-time double-invoke window has
  // passed, and the test would pass no matter what the effect body does. So
  // this seeds the cache before mounting, via a `queryClient` fixed in a
  // closure (NOT `wrapper`'s `getContext()`, which mints a fresh client per
  // render and would silently drop the seed under StrictMode's double-render).
  //
  // This also requires `reactStrictMode: true` (the render OPTION), not a
  // `<StrictMode>` element manually nested inside `wrapper` — verified
  // empirically against this React 19 / @testing-library/react 16 combo:
  // React only double-invokes a mount's effects when `<StrictMode>` is the
  // literal root element under `createRoot`. Nested one level inside an
  // ordinary wrapper component, it silently does NOT double-invoke, and a
  // test built that way would pass regardless of whether the latch it's
  // meant to guard is even present.
  //
  // This only asserts the extraction call count, not that the mutation goes
  // on to dispatch: `useMutation.mutate()` called from an effect under
  // `renderHook(..., { reactStrictMode: true })` never actually settles in
  // this environment (verified with a minimal repro unrelated to this hook —
  // a bare `useMutation` + `mutate()`-on-mount hook has the same issue), so
  // asserting on `dispatchMock` here would hang regardless of this hook's
  // correctness. The call count is exactly what I1 is about, so that's what
  // this checks.
  it("I1: StrictMode's double-effect invocation does not cause a duplicate extractRecomendacion call when the GET is already cached", async () => {
    extractRecomendacionMock.mockResolvedValue(extraction());
    const file = makeFile();
    const documentId = file.paragraphs?.[0]?.document_id;

    const { queryClient } = getContext();
    queryClient.setQueryData(
      ["recomendacion", api.defaults.baseURL, documentId],
      null,
    );

    function seededWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    renderHook(() => useDataExtraction(file), {
      wrapper: seededWrapper,
      reactStrictMode: true,
    });

    await waitFor(() => expect(extractRecomendacionMock).toHaveBeenCalled());

    expect(loadRecomendacionMock).not.toHaveBeenCalled();
    expect(extractRecomendacionMock).toHaveBeenCalledTimes(1);
  });

  // N2: `queryClient.cancelQueries` does NOT put a query without prior data
  // into an error state (query-core reverts it to "pending"/idle instead of
  // dispatching "error"). Left unaddressed, aborting mid-GET would produce
  // exactly the I2(a) permanent-loading dead end this round's Stop-button
  // wiring was supposed to avoid.
  it("N2: aborting mid-GET reaches an actionable error state, and retry re-runs the GET", async () => {
    let resolveLoad: (value: RecomendacionDocument | null) => void = () => {};
    loadRecomendacionMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const file = makeFile();

    const { result } = renderHook(() => useDataExtraction(file), { wrapper });

    await waitFor(() => expect(loadRecomendacionMock).toHaveBeenCalledTimes(1));

    // Stop lands while the GET is still in flight.
    act(() => {
      result.current.abort();
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(dispatchMock).not.toHaveBeenCalled();

    // Settle the original (cancelled) GET promise so it can't leak into the
    // next assertions, then retry — it must re-run the GET (the side that
    // was actually cancelled), not jump to the extraction mutation.
    resolveLoad(null);
    extractRecomendacionMock.mockResolvedValue(extraction());
    loadRecomendacionMock.mockResolvedValueOnce(null);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(dispatchMock).toHaveBeenCalledTimes(1));
    expect(extractRecomendacionMock).toHaveBeenCalledWith(
      "doc-1",
      ["hola"],
      expect.any(AbortSignal),
    );
    const recomendacion = dispatchMock.mock.calls[0][0].payload.recomendacion;
    expect(recomendacion.origin).toBe("inference");
  });
});
