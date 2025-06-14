import axios, { CanceledError } from "axios";

import type { PredictLabel, Workflows } from "types/aymurai";
import type { Paragraph } from "types/file";
import { AYMURAI_API_URL } from "utils/config";

interface PredictResponse {
  document: string;
  labels: Omit<PredictLabel, "paragraphId">[];
}

/**
 * Realiza una petición a la AI para poder obtener predicciones en base a un párrafo
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @param serverUrl String with the URL of the AyMurAI api
 * @returns Una lista de `PredictLabel` con las predicciones
 */
export default async function predict(
  paragraph: Paragraph,
  controller: AbortController,
  // biome-ignore lint/style/useDefaultParameterLast: Not imprtant right now
  route: Workflows = "datapublic",
  serverUrl: string,
): Promise<PredictLabel[]> {
  const path =
    route === "datapublic"
      ? `/datapublic/predict/${paragraph.document_id}`
      : "/anonymizer/predict";

  try {
    const response = await axios
      .create({
        baseURL: serverUrl ? serverUrl : AYMURAI_API_URL,
      })
      .post<PredictResponse>(
        path,
        {
          text: paragraph.value,
        },
        {
          signal: controller.signal,
        },
      );

    const data = response.data.labels.map((l) => ({
      ...l,
      start_char: l.attrs.aymurai_alt_start_char || l.start_char,
      end_char: l.attrs.aymurai_alt_end_char || l.end_char,
      text: l.attrs.aymurai_alt_text || l.text,
      paragraphId: paragraph.id,
    }));

    return data;
  } catch (e) {
    // If the POST is cancelled by the controller, just return an empty prediction
    if (e instanceof CanceledError) {
      return [];
      // Otherwise, throw again the same error
    }

    console.error(e);
    const { message } = e as Error;
    throw new Error(message);
  }
}
