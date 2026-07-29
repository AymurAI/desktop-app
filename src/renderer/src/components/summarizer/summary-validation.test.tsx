import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SummaryValidation from "./summary-validation";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  {
    data: new File(["x"], "acta.docx"),
    paragraphs: [
      { id: "p0", document_id: "d0", value: "Texto original completo." },
    ],
    selected: true,
    validationObject: {},
  },
];
vi.mock("@/hooks", () => ({ useFiles: () => mockFiles }));

const mockDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Resumen generado." }],
    },
  ],
};

const { mockDispatch, mockSave, mockNavigate } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockSave: vi.fn().mockResolvedValue(undefined),
  mockNavigate: vi.fn(),
}));

vi.mock("@/context/Summary", () => ({
  useSummary: () => ({
    status: "completed",
    document: mockDocument,
    title: "Resumen acta.docx",
    sourceFileName: "acta.docx",
  }),
  useSummaryDispatch: () => mockDispatch,
  edit: (document: unknown) => ({ type: "edit", document }),
  editTitle: (title: string) => ({ type: "editTitle", title }),
}));

vi.mock("@/services/aymurai/summaryValidationClient", () => ({
  summaryValidationClient: { save: mockSave, load: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Header/BackButton compose Radix `Link`/`createLink` from `@tanstack/react-router`,
// which needs a real router context — stub them like the sibling
// summary-process/voice-to-text tests do.
vi.mock("@/components/layout/header", () => ({
  default: () => <header />,
}));

vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));

describe("SummaryValidation", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockSave.mockClear();
    mockSave.mockResolvedValue(undefined);
  });

  it("renders both the original document panel and the summary editor", () => {
    render(<SummaryValidation />);
    expect(screen.getByText(/Texto original completo/)).toBeInTheDocument();
    expect(screen.getByText("Resumen generado.")).toBeInTheDocument();
  });

  it("saves via the persistence adapter when the editor content changes", () => {
    render(<SummaryValidation />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "acta.docx",
        title: "Resumen acta.docx",
      }),
    );
  });

  it("awaits the save before navigating when Finalizar is clicked", async () => {
    render(<SummaryValidation />);
    fireEvent.click(screen.getByText("validation.finish"));

    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/app/$feature/finish" }),
      ),
    );
  });

  it("shows the save-failed error and stays on screen instead of navigating away, but continues on a second click", async () => {
    mockSave.mockRejectedValueOnce(new Error("network down"));
    render(<SummaryValidation />);

    fireEvent.click(screen.getByText("validation.finish"));

    await screen.findByText("validation.saveFailed");
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("validation.finish"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/app/$feature/finish" }),
      ),
    );
  });

  it("uses a responsive grid that stacks below `lg` instead of a bare 2-column split (RSP-09)", () => {
    const { container } = render(<SummaryValidation />);

    const grid = container.querySelector(
      '[aria-label="validation.originalDocumentLabel"]',
    )?.parentElement as HTMLElement;
    const classes = grid.className.split(/\s+/);

    expect(classes).toContain("grid-tc_repeat(1,_minmax(0,_1fr))");
    expect(classes).toContain("lg:grid-tc_repeat(2,_minmax(0,_1fr))");
    expect(classes).toContain("desktop:grid-tc_repeat(2,_minmax(0,_1fr))");
    expect(classes).toContain("grid-tr_[repeat(2,_minmax(0,_1fr))]");
    expect(classes).toContain("lg:grid-tr_[minmax(0,_1fr)]");
  });

  it("dedupes a save already in flight instead of firing a second network write", async () => {
    let resolveSave!: () => void;
    mockSave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    render(<SummaryValidation />);

    // Realistic sequence: finishing an edit blurs the editor (kicking off a
    // save), then the user immediately clicks "Finalizar" before that save
    // has resolved — this used to fire a second, uncoordinated
    // `summaryValidationClient.save()` call.
    fireEvent.blur(screen.getByRole("textbox"));
    fireEvent.click(screen.getByText("validation.finish"));

    expect(mockSave).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/app/$feature/finish" }),
      ),
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
