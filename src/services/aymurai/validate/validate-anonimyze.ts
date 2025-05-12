import axios, { CanceledError } from "axios";
import { PredictLabel } from "types/aymurai";
import { Paragraph } from "types/file";
import { AYMURAI_API_URL } from "utils/config";

/**
 * Realiza una petición a la AI para verificar si existen predicciones del anonimizador guardadas para un párrafo determinado (chequea a partir de un hash generado por el backend basado en el contenido textual del párrafo)
 * @param paragraph Párrafo a analizar
 * @param controller `AbortController` encargado de mandar una señal de cancelación a `axios`
 * @param serverUrl String with the URL of the AyMurAI api
 * @returns Una lista de `PredictLabel` o null
 */
export async function validateAnonymizer(
  paragraph: Paragraph,
  controller: AbortController,
  serverUrl: string
): Promise<PredictLabel[] | null> {
  try {
    const response = await axios
      .create({
        baseURL: !!serverUrl ? serverUrl : AYMURAI_API_URL,
      })
      .post<PredictLabel[] | null>(
        `/anonymizer/validation`,
        {
          text: paragraph.value,
        },
        {
          signal: controller.signal,
        }
      );

    if (response.data) {
      console.log("🍺 Validation brings me: ", response.data);
      const data = response.data.map((l) => ({
        ...l,
        start_char: l.attrs.aymurai_alt_start_char || l.start_char,
        end_char: l.attrs.aymurai_alt_end_char || l.end_char,
        text: l.attrs.aymurai_alt_text || l.text,
        paragraphId: paragraph.id,
      }));
      return data;
    }
    return null;
  } catch (e) {
    if (e instanceof CanceledError) {
      return null;
    } else {
      console.error(e);
      const { message } = e as Error;
      throw new Error(message);
    }
  }
}
