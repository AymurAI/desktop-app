import { CanceledError } from 'axios';

import { PredictLabel, Workflows } from 'types/aymurai';
import { Paragraph } from 'types/file';

import { fetcher } from './utils';

interface PredictResponse {
  document: string;
  labels: Omit<PredictLabel, 'paragraphId'>[];
}

/**
 * Realiza una petición a la AI para poder obtener predicciones en base a un párrafo
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @returns Una lista de `PredictLabel` con las predicciones
 */
export default async function predict(
  paragraph: Paragraph,
  controller: AbortController,
  route: Workflows = 'datapublic'
): Promise<PredictLabel[]> {
  try {
    const response = await fetcher.post<PredictResponse>(
      `/${route}/predict`,
      {
        text: paragraph.value,
      },
      {
        signal: controller.signal,
      }
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
    } else {
      console.error(e);
      const { message } = e as Error;
      throw new Error(message);
    }
  }
}
