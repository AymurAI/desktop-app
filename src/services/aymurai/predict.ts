import { CanceledError } from 'axios';

import { PredictLabel, Workflows } from 'types/aymurai';
import { fetcher } from './utils';

interface PredictResponse {
  document: string;
  labels: PredictLabel[];
}

/**
 * Realiza una petición a la AI para poder obtener predicciones en base a un párrafo
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @returns Una lista de `PredictLabel` con las predicciones
 */
export default async function predict(
  paragraph: string,
  controller: AbortController,
  route: Workflows = 'datapublic'
): Promise<PredictLabel[]> {
  try {
    const response = await fetcher.post<PredictResponse>(
      route,
      {
        text: paragraph,
      },
      {
        signal: controller.signal,
      }
    );
    return response.data.labels.map((l) => ({ ...l, paragraph }));
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
