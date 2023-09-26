import { CanceledError } from "axios";

import { PredictLabel, PredictSuccess } from "types/aymurai";
import { fetcher } from "./utils";

/**
 * Realiza una petición a la AI para poder obtener predicciones en base a un párrafo
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @returns Una lista de `PredictLabel` con las predicciones
 */
export default async function predict(
  paragraph: string,
  controller: AbortController,
  route: string
): Promise<PredictLabel[]> {
  try {
    console.log(route);
    const response = await fetcher.post<PredictSuccess>(
      route,
      {
        text: paragraph,
      },
      {
        signal: controller.signal,
      }
    );
    return response.data.labels;
  } catch (e) {
    // If the POST is cancelled by the controller, just return an empty prediction
    if (e instanceof CanceledError) {
      return [];
      // Otherwise, throw again the same error
    } else {
      const { message } = e as Error;
      throw new Error(message);
    }
  }
}
