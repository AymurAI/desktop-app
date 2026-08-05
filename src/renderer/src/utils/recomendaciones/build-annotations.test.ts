import type { Paragraph } from "@/types/file";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { describe, expect, it } from "vitest";
import { buildExtractedAnnotations } from "./build-annotations";

const paragraphs: Paragraph[] = [
  { id: "d:0", document_id: "d", value: "Buenos Aires, 30 de mayo de 2022." },
  {
    id: "d:1",
    document_id: "d",
    value: "Se recomienda a Ana Pérez, Directora General.",
  },
];

const values: RecomendacionValues = {
  numero_recomendacion: "",
  fecha_recomendacion: "30 de mayo de 2022",
  destinatarios: [
    {
      id: "x1",
      nombre: "Ana Pérez",
      cargo: "Directora General",
      destinatario_principal: true,
      sector: "GCBA",
    },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Un resumen que no está en el texto.",
};

describe("buildExtractedAnnotations", () => {
  it("annotates fecha, nombre and cargo, keyed by paragraph id", () => {
    const map = buildExtractedAnnotations(values, paragraphs);
    expect(map.get("d:0")?.map((a) => a.field)).toEqual([
      "fecha_recomendacion",
    ]);
    expect(map.get("d:1")?.map((a) => a.field)).toEqual([
      "destinatario:x1:nombre",
      "destinatario:x1:cargo",
    ]);
  });

  it("never annotates tema, subtema, sector, datos_personales or contenido", () => {
    const fields = [...buildExtractedAnnotations(values, paragraphs).values()]
      .flat()
      .map((a) => a.field);
    expect(fields).not.toContain("tema");
    expect(fields).not.toContain("subtema");
    expect(fields).not.toContain("destinatario:x1:sector");
    expect(fields).not.toContain("contenido_para_publicar");
  });

  it("skips empty fields", () => {
    const fields = [...buildExtractedAnnotations(values, paragraphs).values()]
      .flat()
      .map((a) => a.field);
    expect(fields).not.toContain("numero_recomendacion");
  });

  it("returns non-overlapping ranges within a paragraph", () => {
    const overlapping = [
      {
        id: "d:0",
        document_id: "d",
        value: "Directora General de Fiscalización",
      },
    ];
    const annotations =
      buildExtractedAnnotations(
        {
          ...values,
          fecha_recomendacion: "",
          destinatarios: [
            {
              id: "x1",
              nombre: "Directora General",
              cargo: "Directora General de Fiscalización",
              destinatario_principal: true,
              sector: "",
            },
          ],
        },
        overlapping,
      ).get("d:0") ?? [];
    for (let i = 1; i < annotations.length; i++) {
      expect(annotations[i].start).toBeGreaterThanOrEqual(
        annotations[i - 1].end,
      );
    }
  });
});
