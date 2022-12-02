import { PredictLabel } from 'types/predict';
import axios from 'axios';
import { PREDICT_PORT } from 'utils/config';

const mockPrediction: PredictLabel[] = [
  {
    text: '6 de enero de 2022.',
    start_char: 14,
    end_char: 33,
    attrs: {
      aymurai_label: 'FECHA_RESOLUCION',
      aymurai_label_subclass: null,
      aymurai_alt_text: null,
    },
  },
];

const fetcher = axios.create({
  baseURL: `http://localhost:${PREDICT_PORT}/predict`,
});

export default async function predict(
  paragraph: string,
  controller: AbortController
): Promise<PredictLabel[]> {
  // TODO implementar logica para hacer fertches a la API

  return new Promise((resolve) =>
    setTimeout(() => resolve(mockPrediction), Math.floor(Math.random() * 1000))
  );
}
