import { CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from "@/services/api";
import {
  extractRecomendacion,
  loadRecomendacion,
  saveRecomendacion,
} from "./recomendaciones";

beforeEach(() => {
  vi.mocked(api.post).mockReset();
  vi.mocked(api.get).mockReset();
});

describe("extractRecomendacion", () => {
  it("posts the document envelope the backend expects", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        numero_recomendacion: "1/24",
        fecha_recomendacion: null,
        destinatarios: [],
        tema: null,
        subtema: null,
        datos_personales: false,
        contenido_para_publicar: "x",
      },
    });

    const result = await extractRecomendacion("doc-1", ["p1", "p2"]);

    expect(api.post).toHaveBeenCalledWith(
      "/llm/data-extraction",
      { document: { document_id: "doc-1", document: ["p1", "p2"] } },
      expect.anything(),
    );
    expect(result.numero_recomendacion).toBe("1/24");
  });

  it("does not swallow errors — a failed extraction propagates", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("boom"));

    await expect(extractRecomendacion("doc-1", ["p1"])).rejects.toThrow("boom");
  });
});

describe("loadRecomendacion", () => {
  it("returns null on 404 instead of throwing", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(loadRecomendacion("doc-1")).resolves.toBeNull();
  });

  it("returns null when the endpoint does not exist yet", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 405 } });
    await expect(loadRecomendacion("doc-1")).resolves.toBeNull();
  });

  it("re-throws a CanceledError instead of degrading to null", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new CanceledError());
    await expect(loadRecomendacion("doc-1")).rejects.toBeInstanceOf(
      CanceledError,
    );
  });

  it("returns null on a generic network error (graceful fallback)", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));
    await expect(loadRecomendacion("doc-1")).resolves.toBeNull();
  });
});

describe("saveRecomendacion", () => {
  it("posts the validation payload to the validation endpoint", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: null });

    const validation = {
      numero_recomendacion: "1/24",
      fecha_recomendacion: null,
      destinatarios: [],
      tema: null,
      subtema: null,
      datos_personales: false,
      contenido_para_publicar: "x",
    };

    await saveRecomendacion("doc-1", validation);

    expect(api.post).toHaveBeenCalledWith(
      "/llm/recomendaciones/validation/document/doc-1",
      validation,
      expect.anything(),
    );
  });
});
