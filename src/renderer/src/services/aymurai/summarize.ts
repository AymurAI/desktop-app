import { USE_MOCK_SUMMARIZE } from "@/constants/config";
import { mockSummarizeStream } from "./mockSummarize";
import { type SummarizeStreamOptions, summarizeStream } from "./summarization";

export function summarizeDocumentStream(
  text: string,
  options: SummarizeStreamOptions,
) {
  return USE_MOCK_SUMMARIZE
    ? mockSummarizeStream(text, options)
    : summarizeStream(text, options);
}
