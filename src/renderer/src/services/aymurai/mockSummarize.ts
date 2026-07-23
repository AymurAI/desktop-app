import { SUMMARIZE_MOCK_DELAY_MS } from "@/constants/config";
import type {
  SummarizationResponse,
  SummarizeStreamOptions,
} from "./summarization";

const MOCK_SUMMARY =
  "Este es un resumen de prueba generado localmente, sin backend, para " +
  "desarrollar y probar la pantalla de validación de extremo a extremo.";

export async function mockSummarizeStream(
  _text: string,
  { signal, onPartialText }: SummarizeStreamOptions,
): Promise<SummarizationResponse> {
  const words = MOCK_SUMMARY.split(" ");
  let acc = "";

  for (const word of words) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise((resolve) =>
      setTimeout(resolve, SUMMARIZE_MOCK_DELAY_MS),
    );
    acc += (acc ? " " : "") + word;
    onPartialText?.(acc);
  }

  return { summary: acc, model: "mock", chunks_used: 1, steps: [] };
}
