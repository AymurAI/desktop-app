import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinishDataset from "./finish-dataset";

vi.mock("@/hooks/useFiles", () => ({
  useFiles: () => [
    {
      data: new File(["a"], "a.docx"),
      selected: true,
      validationObject: {},
    },
  ],
}));

const { submitValidations, exportFeedback } = vi.hoisted(() => ({
  submitValidations: vi.fn(),
  exportFeedback: vi.fn(),
}));
vi.mock("@/utils/file", () => ({ submitValidations }));

vi.mock("@/services/filesystem", () => ({
  default: {
    feedback: { export: (...args: unknown[]) => exportFeedback(...args) },
    excel: { open: vi.fn() },
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../file-check", () => ({
  default: ({
    fileName,
    hasError,
    isLoading,
  }: {
    fileName: string;
    hasError: boolean;
    isLoading: boolean;
  }) => (
    <div
      data-testid={`file-${fileName}`}
      data-error={String(hasError)}
      data-loading={String(isLoading)}
    />
  ),
}));
vi.mock("./finish-main-content", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../layout/footer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("FinishDataset filesystem failures", () => {
  beforeEach(() => {
    submitValidations.mockReset().mockResolvedValue(undefined);
    exportFeedback.mockReset().mockResolvedValue(undefined);
  });

  it("leaves loading without marking the file when only feedback export fails", async () => {
    exportFeedback.mockRejectedValue(new Error("no filesystem API"));
    render(<FinishDataset onRestart={vi.fn()} />);

    const file = screen.getByTestId("file-a.docx");
    await waitFor(() => expect(file).toHaveAttribute("data-loading", "false"));

    expect(file).toHaveAttribute("data-error", "false");
    expect(exportFeedback).toHaveBeenCalledOnce();
  });

  it("marks a failed document and still exports feedback", async () => {
    submitValidations.mockRejectedValue(new Error("write failed"));
    render(<FinishDataset onRestart={vi.fn()} />);

    const file = screen.getByTestId("file-a.docx");
    await waitFor(() => expect(file).toHaveAttribute("data-error", "true"));

    expect(file).toHaveAttribute("data-loading", "false");
    expect(exportFeedback).toHaveBeenCalledOnce();
  });
});
