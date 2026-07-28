import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FileProcessing from "./file-processing";

const dispatch = vi.fn();

vi.mock("@/hooks", () => ({
  useFileDispatch: () => dispatch,
}));

const withQueryClient = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("document archive components", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  it("maps processing, stopped and error states to ArchiveProgress", () => {
    const onAbort = vi.fn();
    const { rerender } = render(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="processing"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(screen.getByText("42%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Detener" }));
    expect(onAbort).toHaveBeenCalledOnce();

    rerender(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="stopped"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(screen.getByRole("button", { name: "Detener" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Reemplazar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Descartar" })).toBeNull();

    rerender(
      withQueryClient(
        <FileProcessing
          fileName="sample.docx"
          status="error"
          progress={0.42}
          onAbort={onAbort}
        />,
      ),
    );

    expect(
      screen.getByRole("button", { name: "Reemplazar" }),
    ).toBeInTheDocument();
  });
});
