import type { DocFile } from "@/types/file";

const PARAGRAPHS = [
  "En la Ciudad Autónoma de Buenos Aires, a los quince días del mes de marzo de dos mil veinticinco, se reúnen las partes a los efectos de dar tratamiento a la presente causa.",
  "Vistos los antecedentes obrantes en el expediente y oídas las partes en la audiencia celebrada, corresponde expedirse sobre la medida cautelar solicitada por la parte denunciante.",
  "Que conforme surge de las constancias de autos, la denunciante manifestó haber sufrido actos de violencia por parte del denunciado, hechos que motivaron la intervención de este tribunal.",
  "Que el denunciado, debidamente notificado, compareció a la audiencia acompañado de su letrado patrocinante, quien solicitó se difiera la resolución hasta tanto se produzca la prueba ofrecida.",
  "Por todo lo expuesto, y en atención a lo dispuesto por la normativa vigente en materia de protección contra la violencia de género, este juzgado resuelve hacer lugar a la medida solicitada.",
  "Notifíquese a las partes y a los organismos pertinentes, líbrense los oficios correspondientes y estese a las resultas de la audiencia de seguimiento fijada para el día treinta de abril.",
] as const;

export function buildDocFileFixture(): DocFile {
  return {
    data: new File([new Uint8Array(51_200)], "documento.docx"),
    paragraphs: PARAGRAPHS.map((value, index) => ({
      id: `p-${index}`,
      document_id: "doc-fixture",
      value,
    })),
    // Deliberately `[]`, not left `undefined`: `countDecisiones` treats "no
    // predictions given" (undefined) and "predictions given, none found"
    // ([]) differently - only the latter falls back to 1 decision. Leaving
    // this undefined starves useForm's DECISIONES array down to length 0
    // and every field's ref-registration in FormGroup's Decision/InfoHecho
    // forms throws on mount.
    predictions: [],
    selected: true,
    validationObject: {},
  };
}
