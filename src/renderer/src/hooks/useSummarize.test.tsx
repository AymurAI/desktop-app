import { summarizeDocumentStream } from "@/services/aymurai/summarize";
import type { DocFile } from "@/types/file";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { CanceledError } from "axios";
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

  it("ignores a stale mutation settling after a newer file supersedes it", async () => {
    const dispatch = vi.fn();
    const fileA = makeFile("a.docx", "Texto A");
    const fileB = makeFile("b.docx", "Texto B");

    // File A's request never resolves on its own — we control it manually to
    // simulate it settling *after* file B's session has already started.
    let resolveA:
      | ((value: {
          summary: string;
          model: string;
          chunks_used: number;
          steps: never[];
        }) => void)
      | undefined;
    const pendingA = new Promise((resolve) => {
      resolveA = resolve;
    });

    const mockedStream = vi.mocked(summarizeDocumentStream);
    // Reset call history — the mock is shared module-wide and earlier tests
    // in this file have already invoked it.
    mockedStream.mockClear();
    mockedStream.mockImplementationOnce(async () => pendingA as never);

    const queryClient = new QueryClient();
    const { rerender } = renderHook(
      ({ file }: { file: DocFile }) => useSummarize(file, { dispatch }),
      {
        initialProps: { file: fileA },
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    // Wait until file A's mutationFn has actually fired (i.e. the deferred
    // StrictMode-dodging microtask has flushed and consumed the mocked
    // implementation) before switching files — otherwise the switch could
    // race ahead of A's mutate() call and this test would prove nothing.
    await waitFor(() => expect(mockedStream).toHaveBeenCalledTimes(1));

    dispatch.mockClear();

    // Resolve file A's request and switch to file B back-to-back, with no
    // await between them. This queues A's success-notification microtasks
    // *before* B's own deferred mutate() microtask, reproducing the narrow
    // window where A's mutation observer callback could still be attached
    // when A's stale result arrives — the exact race under test.
    resolveA?.({
      summary: "Stale A summary",
      model: "mock",
      chunks_used: 1,
      steps: [],
    });
    rerender({ file: fileB });

    // Flush enough microtask/macrotask turns for both A's stale resolution
    // and B's own (immediately-resolving, per the default mock) mutation to
    // fully settle.
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "finish", summary: "Hola mundo" }),
      ),
    );

    // B's own summary must win; A's stale summary must never have been
    // dispatched as a "finish" for B's session.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "finish", summary: "Stale A summary" }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    );
  });

  it("reports 'stopped' (not 'error') when a file switch aborts an in-flight request", async () => {
    // Regression test for the CanceledError-conversion fix: the transport
    // (summarizeStream/mockSummarizeStream) must reject with axios's
    // CanceledError on abort, matching transcribeStream, so status doesn't
    // read "error" just because the effect cleanup (not the exposed abort())
    // cancelled the request while switching files.
    const fileA = makeFile("a.docx", "Texto A");
    const fileB = makeFile("b.docx", "Texto B");

    const mockedStream = vi.mocked(summarizeDocumentStream);
    mockedStream.mockClear();
    mockedStream.mockImplementationOnce(
      (_text, { signal }) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(new CanceledError()));
        }),
    );

    const queryClient = new QueryClient();
    const { result, rerender } = renderHook(
      ({ file }: { file: DocFile }) => useSummarize(file),
      {
        initialProps: { file: fileA },
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await waitFor(() => expect(mockedStream).toHaveBeenCalledTimes(1));

    rerender({ file: fileB });

    await waitFor(() => expect(result.current.status).not.toBe("idle"));
    expect(result.current.status).not.toBe("error");
  });
});
