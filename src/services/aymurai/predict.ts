import { CanceledError } from 'axios';

import { PredictLabel, PredictSuccess } from 'types/aymurai';
import { fetcher } from './utils';

const predictions: PredictLabel[] = [
  {
    text: '12 de enero de 2022',
    start_char: 0,
    end_char: 0,
    attrs: {
      aymurai_label: 'FECHA_RESOLUCION',
      aymurai_label_subclass: null,
      aymurai_alt_text: null,
    },
  },
];

/**
 * Realiza una petición a la AI para poder obtener predicciones en base a un párrafo
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @returns Una lista de `PredictLabel` con las predicciones
 */
export default async function predict(
  paragraph: string,
  controller: AbortController
): Promise<PredictLabel[]> {
  try {
    return new Promise<PredictLabel[]>((resolve, reject) => {
      setTimeout(() => resolve(predictions), Math.round(Math.random() * 1000));
    });
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
