import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FilePreview from "./file-preview";
import FileProcessing from "./file-processing";

const dispatch = vi.fn();

vi.mock("@/hooks", () => ({
  useFileDispatch: () => dispatch,
}));

vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ feature: "DATA_SET" }),
}));

const file = {
  data: new File(["document"], "sample.docx"),
  paragraphs: [
    { id: "1", document_id: "sample", value: "Primer párrafo" },
    { id: "2", document_id: "sample", value: "Segundo párrafo" },
  ],
  selected: true,
  validationObject: {},
};

const withQueryClient = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("document archive components", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  it("renders parsed documents through ArchiveView and keeps selection", () => {
    render(<FilePreview file={file} status="completed" />);

    const preview = screen.getByRole("img", { name: "sample.docx" });
    expect(preview).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml"),
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(dispatch).toHaveBeenCalledOnce();
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
