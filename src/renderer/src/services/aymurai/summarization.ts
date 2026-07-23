import api from "@/services/api";

export interface SummarizationRequest {
  text: string;
  model?: string;
}

export interface SummarizationStep {
  chunk_index: number;
  input_tokens: number;
  source: string;
}

export interface SummarizationResponse {
  summary: string;
  model: string;
  chunks_used: number;
  steps: SummarizationStep[];
}

export type SummaryStreamEvent =
  | { type: "meta"; model?: string }
  | { type: "token"; chunk_index?: number; source?: string; text: string }
  | {
      type: "summary";
      summary: string;
      chunks_used?: number;
      steps?: SummarizationStep[];
      model?: string;
    };

export function parseSseMessages(buffer: string): {
  events: SummaryStreamEvent[];
  remainder: string;
} {
  const frames = buffer.split("\n\n");
  const remainder = frames.pop() ?? "";
  const events: SummaryStreamEvent[] = [];

  for (const frame of frames) {
    const dataLines = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim());
    if (dataLines.length === 0) continue;

    try {
      events.push(JSON.parse(dataLines.join("")) as SummaryStreamEvent);
    } catch {
      // Malformed frame — drop it and keep going.
    }
  }

  return { events, remainder };
}

class FatalStreamError extends Error {}

export interface SummarizeStreamOptions {
  signal?: AbortSignal;
  onPartialText?: (text: string) => void;
}

export async function summarizeStream(
  text: string,
  { signal, onPartialText }: SummarizeStreamOptions,
): Promise<SummarizationResponse> {
  const baseURL = api.defaults.baseURL?.replace(/\/$/, "");
  if (!baseURL) {
    throw new Error(
      "No server selected. Connect to a server from the login page first.",
    );
  }

  const response = await fetch(`${baseURL}/llm/summarize/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ text } satisfies SummarizationRequest),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new FatalStreamError(
      `Summarization stream failed: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const tokens: string[] = [];
  let finalResponse: SummarizationResponse | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseMessages(buffer);
    buffer = parsed.remainder;

    for (const event of parsed.events) {
      if (event.type === "token") {
        tokens.push(event.text);
        onPartialText?.(tokens.join(""));
      } else if (event.type === "summary") {
        finalResponse = {
          summary: event.summary,
          model: event.model ?? "",
          chunks_used: event.chunks_used ?? 0,
          steps: event.steps ?? [],
        };
      }
    }
  }

  if (!finalResponse) {
    throw new FatalStreamError(
      "Summarization stream ended without a final summary event",
    );
  }

  return finalResponse;
}

export async function summarize(
  text: string,
  signal?: AbortSignal,
): Promise<SummarizationResponse> {
  const response = await api.post<SummarizationResponse>(
    "/llm/summarize",
    { text } satisfies SummarizationRequest,
    { signal },
  );
  return response.data;
}
