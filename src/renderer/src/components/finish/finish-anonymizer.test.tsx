import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinishAnonymizer from "./finish-anonymizer";

// jsdom doesn't implement scrollIntoView, which Radix's Select calls when the
// listbox opens.
HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const navigateSpy = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateSpy,
}));

let mockFile = { data: new File(["x"], "acta.docx") };
vi.mock("@/hooks", () => ({
  useFiles: () => [mockFile],
}));

vi.mock("@/store/useLocal", () => ({
  useExcludedTagsConfig: () => ({ tags: null, words: [] }),
}));

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock("@/features/showToast", () => ({ showToast }));

const anonymizeBlob = new Blob(["anonymized"]);
const pdfBlob = new Blob(["pdf"]);
const odtBlob = new Blob(["odt"]);

const {
  anonymizeQueryFn,
  odtToPdfMutationFn,
  pdfToOdtMutationFn,
  downloadBlob,
} = vi.hoisted(() => ({
  anonymizeQueryFn: vi.fn().mockResolvedValue(new Blob(["anonymized"])),
  odtToPdfMutationFn: vi.fn(),
  pdfToOdtMutationFn: vi.fn(),
  downloadBlob: vi.fn(),
}));

vi.mock("@/services/export/download-blob", () => ({ downloadBlob }));

vi.mock("@/services/aymurai", () => ({
  aymuraiService: {
    anonymize: () => ({
      queryKey: ["anonymize-test"],
      queryFn: anonymizeQueryFn,
    }),
    odtToPdf: () => ({ mutationFn: odtToPdfMutationFn }),
    pdfToOdt: () => ({ mutationFn: pdfToOdtMutationFn }),
  },
}));

const withQueryClient = (children: ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe("FinishAnonymizer", () => {
  beforeEach(() => {
    mockFile = { data: new File(["x"], "acta.docx") };
    anonymizeQueryFn.mockReset().mockResolvedValue(anonymizeBlob);
    odtToPdfMutationFn.mockReset().mockResolvedValue(pdfBlob);
    pdfToOdtMutationFn.mockReset().mockResolvedValue(odtBlob);
    downloadBlob.mockReset();
    navigateSpy.mockReset();
    showToast.mockReset();
  });

  it("calls anonymize on mount with the exact file, tags and words", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(anonymizeQueryFn).toHaveBeenCalledTimes(1));
  });

  it("defaults to .odt for a DOCX input", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
  });

  it("defaults to .pdf for a PDF input", async () => {
    mockFile = { data: new File(["x"], "acta.pdf") };
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".pdf")).toBeInTheDocument());
  });

  it("defaults to .odt for an unresolvable input", async () => {
    mockFile = { data: new File(["x"], "acta") };
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
  });

  it("renders exactly two format options with no .txt", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
    fireEvent.click(screen.getByText(".odt"));
    expect(screen.getAllByText(".odt").length).toBeGreaterThan(0);
    expect(screen.getByText(".pdf")).toBeInTheDocument();
    expect(screen.queryByText(".txt")).not.toBeInTheDocument();
  });

  it("renders the file name and 'Archivo procesado' heading in the left panel", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    expect(screen.getByText("finish.subtitle")).toBeInTheDocument();
    expect(screen.getByText("acta.docx")).toBeInTheDocument();
  });

  it("exports DOCX->ODT without calling either conversion mutation", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "finish.export" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(
        anonymizeBlob,
        "acta_anonimizado.odt",
      ),
    );
    expect(odtToPdfMutationFn).not.toHaveBeenCalled();
    expect(pdfToOdtMutationFn).not.toHaveBeenCalled();
  });

  it("exports DOCX->PDF via odtToPdf", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
    fireEvent.click(screen.getByText(".odt"));
    fireEvent.click(await screen.findByText(".pdf"));

    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(
        pdfBlob,
        "acta_anonimizado.pdf",
      ),
    );
    expect(odtToPdfMutationFn).toHaveBeenCalledWith(
      anonymizeBlob,
      expect.anything(),
    );
    expect(pdfToOdtMutationFn).not.toHaveBeenCalled();
  });

  it("exports PDF->PDF without calling either conversion mutation", async () => {
    mockFile = { data: new File(["x"], "acta.pdf") };
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "finish.export" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(
        anonymizeBlob,
        "acta_anonimizado.pdf",
      ),
    );
    expect(odtToPdfMutationFn).not.toHaveBeenCalled();
    expect(pdfToOdtMutationFn).not.toHaveBeenCalled();
  });

  it("exports PDF->ODT via pdfToOdt", async () => {
    mockFile = { data: new File(["x"], "acta.pdf") };
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".pdf")).toBeInTheDocument());
    fireEvent.click(screen.getByText(".pdf"));
    fireEvent.click(await screen.findByText(".odt"));

    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(
        odtBlob,
        "acta_anonimizado.odt",
      ),
    );
    expect(pdfToOdtMutationFn).toHaveBeenCalledWith(
      anonymizeBlob,
      expect.anything(),
    );
    expect(odtToPdfMutationFn).not.toHaveBeenCalled();
  });

  it("disables Exportar while a cross-format export is in flight, preventing duplicate requests", async () => {
    let resolveConversion: (blob: Blob) => void = () => {};
    odtToPdfMutationFn.mockReturnValue(
      new Promise<Blob>((resolve) => {
        resolveConversion = resolve;
      }),
    );

    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
    fireEvent.click(screen.getByText(".odt"));
    fireEvent.click(await screen.findByText(".pdf"));

    const exportButton = screen.getByRole("button", { name: "finish.export" });
    fireEvent.click(exportButton);
    await waitFor(() => expect(exportButton).toBeDisabled());
    fireEvent.click(exportButton);

    resolveConversion(pdfBlob);
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    expect(odtToPdfMutationFn).toHaveBeenCalledTimes(1);
  });

  it("shows the export-error callout and leaves the screen interactive when a conversion rejects", async () => {
    odtToPdfMutationFn.mockRejectedValue(new Error("conversion failed"));
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(screen.getByText(".odt")).toBeInTheDocument());
    fireEvent.click(screen.getByText(".odt"));
    fireEvent.click(await screen.findByText(".pdf"));

    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    await waitFor(() =>
      expect(screen.getByText("finish.exportError")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "finish.export" })).toBeEnabled();
  });

  it("shows a toast and disables Exportar when the anonymize query fails", async () => {
    anonymizeQueryFn.mockRejectedValue(new Error("anonymize failed"));
    render(withQueryClient(<FinishAnonymizer />));
    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "finish.export" }),
    ).toBeDisabled();
  });

  it("renders exactly two footer buttons and 'Volver' navigates to validation", async () => {
    render(withQueryClient(<FinishAnonymizer />));
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "finish.back" }));
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/app/$feature/validation",
      params: { feature: "ANONYMIZER" },
    });
  });
});
