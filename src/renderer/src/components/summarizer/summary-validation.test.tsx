import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
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
        // The stable document id (from the file's own paragraphs), not the
        // display filename "acta.docx" — see the "does not collide" test
        // below for why the filename cannot be the key.
        documentId: "d0",
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

  // Adversary: the test above pins the dedup for the case it was written for -
  // blur and click inside ONE user gesture, where both saves would carry
  // identical content, so collapsing them loses nothing. But `handleSave`
  // (summary-validation.tsx:57-58) coalesces unconditionally: it hands back
  // `inFlightSaveRef.current` whatever it contains, and that promise's payload
  // was serialised from `summary.document` at the moment the FIRST save
  // started. Nothing compares content, and nothing re-saves when the in-flight
  // write settles, so any edit made while a slow write is outstanding is
  // dropped - while `handleContinue` awaits that stale promise, sees `true`,
  // and navigates away as if the save had succeeded.
  it("persists an edit made while an earlier save is still in flight instead of coalescing it away", async () => {
    const paragraph = mockDocument.content[0].content[0];
    const originalText = paragraph.text;
    // Restore the shared mock document even when this test fails, so no other
    // test in the file depends on the order it ran in.
    onTestFinished(() => {
      paragraph.text = originalText;
    });

    let resolveFirstSave!: () => void;
    mockSave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve;
        }),
    );

    const { rerender } = render(<SummaryValidation />);

    // 1. The user finishes an edit; leaving the editor starts save #1. The
    //    write is slow and still outstanding.
    fireEvent.blur(screen.getByRole("textbox"));
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0].editedSummary).toContain(
      "Resumen generado.",
    );

    // 2. The user goes back in, corrects the summary, and clicks "Finalizar"
    //    before that first write has come back.
    paragraph.text = "Resumen corregido a mano.";
    rerender(<SummaryValidation />);
    fireEvent.click(screen.getByText("validation.finish"));

    // 3. The first write lands and the app leaves the screen.
    resolveFirstSave();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/app/$feature/finish" }),
      ),
    );

    // The correction must have reached the persistence adapter before the app
    // reported success and navigated away.
    const lastPayload = mockSave.mock.calls.at(-1)?.[0];
    expect(lastPayload?.editedSummary).toContain("Resumen corregido a mano.");
  });

  // Adversary: `documentId: file.data.name` (summary-validation.tsx:60) is a
  // display string, and it is the whole storage key - noopSummaryValidation
  // writes `summary-validation:<documentId>` into localStorage and `load()`
  // reads it back by the same key. Two different rulings that happen to be
  // filed under the same filename (very common: "sentencia.docx" exported from
  // two different case folders) therefore share one record. CONVENTIONS.md's
  // "Join on ids, never on display strings" names exactly this; the file's own
  // paragraphs already carry a stable `document_id`.
  it("keys the persisted summary so two different documents with the same filename do not collide", () => {
    const originalFile = mockFiles[0];
    onTestFinished(() => {
      mockFiles[0] = originalFile;
    });

    const documentA = {
      ...originalFile,
      data: new File(["a"], "sentencia.docx"),
      paragraphs: [{ id: "p0", document_id: "case-a", value: "Expediente A." }],
    };
    const documentB = {
      ...originalFile,
      data: new File(["b"], "sentencia.docx"),
      paragraphs: [{ id: "p0", document_id: "case-b", value: "Expediente B." }],
    };

    // Two separate visits to the screen - the real sequence (validate one
    // ruling, later validate another) - so each gets its own component
    // instance and neither save can be coalesced into the other.
    mockFiles[0] = documentA;
    const { unmount } = render(<SummaryValidation />);
    fireEvent.blur(screen.getByRole("textbox"));
    const keyForA = mockSave.mock.calls.at(-1)?.[0]?.documentId;
    unmount();

    mockFiles[0] = documentB;
    render(<SummaryValidation />);
    fireEvent.blur(screen.getByRole("textbox"));
    const keyForB = mockSave.mock.calls.at(-1)?.[0]?.documentId;

    // Both saves really happened - guards against a vacuous pass where the
    // second blur never reached the adapter at all.
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(keyForA).toBeTruthy();
    expect(keyForB).toBeTruthy();

    // Distinct documents must land under distinct keys, or the second save
    // destroys the first document's persisted summary and `load()` can never
    // tell them apart again.
    expect(keyForB).not.toBe(keyForA);
  });
});
