import type { DocFile } from "@/types/file";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSummarize } from "./useSummarize";

vi.mock("@/services/aymurai/summarize", () => ({
  summarizeDocumentStream: vi.fn(
    async (
      _text: string,
      { onPartialText }: { onPartialText?: (t: string) => void },
    ) => {
      onPartialText?.("Hola");
      onPartialText?.("Hola mundo");
      return {
        summary: "Hola mundo",
        model: "mock",
        chunks_used: 1,
        steps: [],
      };
    },
  ),
}));

function makeFile(name: string, text: string): DocFile {
  return {
    data: new File(["x"], name),
    paragraphs: [{ id: "p0", document_id: "d0", value: text }],
    selected: true,
    validationObject: {},
  } as DocFile;
}

function renderWithClient(hook: () => ReturnType<typeof useSummarize>) {
  const queryClient = new QueryClient();
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useSummarize", () => {
  it("dispatches start, streamed partial text, and finish", async () => {
    const dispatch = vi.fn();
    const file = makeFile("acta.docx", "Texto original.");

    renderWithClient(() => useSummarize(file, { dispatch }));

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "finish", summary: "Hola mundo" }),
      ),
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start", fileName: "acta.docx" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "setPartialText", text: "Hola mundo" }),
    );
  });

  it("does nothing when there is no file", () => {
    const dispatch = vi.fn();
    renderWithClient(() => useSummarize(undefined, { dispatch }));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("abort() marks status as stopped", async () => {
    const file = makeFile("acta.docx", "Texto original.");
    const { result } = renderWithClient(() => useSummarize(file));

    await waitFor(() => expect(result.current.status).not.toBe("idle"));
    act(() => result.current.abort());
    expect(result.current.status).toBe("stopped");
  });
});
