import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SummaryProvider, {
  edit,
  editTitle,
  error,
  finish,
  reset,
  setPartialText,
  start,
  stop,
  useSummary,
  useSummaryDispatch,
} from "./Summary";

function wrapper({ children }: { children: React.ReactNode }) {
  return <SummaryProvider>{children}</SummaryProvider>;
}

describe("Summary context", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useSummary(), { wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.document).toBeNull();
  });

  it("start() sets status to streaming and derives a default title", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("acta.docx")));
    expect(result.current.state.status).toBe("streaming");
    expect(result.current.state.title).toBe("Resumen acta.docx");
  });

  it("setPartialText() replaces (not appends to) partialText", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(setPartialText("Hola")));
    act(() => result.current.dispatch(setPartialText("Hola mundo")));
    expect(result.current.state.partialText).toBe("Hola mundo");
  });

  it("finish() sets status to completed and parses the summary into a document", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() =>
      result.current.dispatch(finish("Primer párrafo.\n\nSegundo párrafo.")),
    );
    expect(result.current.state.status).toBe("completed");
    expect(result.current.state.document?.paragraphs).toHaveLength(2);
  });

  it("error()/stop() set the corresponding status", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(error("boom")));
    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toBe("boom");

    act(() => result.current.dispatch(stop()));
    expect(result.current.state.status).toBe("stopped");
  });

  it("edit()/editTitle() update the document and title without touching status", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(finish("Texto.")));
    act(() =>
      result.current.dispatch(edit({ paragraphs: [{ id: "p0", runs: [] }] })),
    );
    act(() => result.current.dispatch(editTitle("Nuevo título")));
    expect(result.current.state.status).toBe("completed");
    expect(result.current.state.document).toEqual({
      paragraphs: [{ id: "p0", runs: [] }],
    });
    expect(result.current.state.title).toBe("Nuevo título");
  });

  it("reset() returns to the initial state", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(reset()));
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.title).toBe("");
  });
});
