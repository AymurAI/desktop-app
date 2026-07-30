import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ValidateDataset } from "./index";

const fileAnnotatorSpy = vi.fn();

vi.mock("@/hooks", () => ({
  useFiles: () => [
    {
      data: new File(["x"], "a.docx"),
      selected: true,
      validationObject: {},
    },
  ],
  useFileDispatch: () => vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ feature: "DATA_SET" }),
}));
vi.mock("@/utils/file", () => ({
  isFileValidated: () => false,
  isValidationCompleted: () => false,
}));
vi.mock("../file-annotator", () => ({
  default: (props: Record<string, unknown>) => {
    fileAnnotatorSpy(props);
    return <div data-testid="file-annotator-stub" />;
  },
}));
vi.mock("./form-group", () => ({ default: () => null }));
vi.mock("@/components/layout/footer", () => ({
  default: ({
    children,
    withBuiltBy,
  }: {
    children: ReactNode;
    withBuiltBy?: boolean;
  }) => (
    <footer data-testid="footer" data-built-by={String(withBuiltBy)}>
      {children}
    </footer>
  ),
}));

describe("ValidateDataset footer", () => {
  it("requests the DataGénero credit", () => {
    render(<ValidateDataset />);

    expect(screen.getByTestId("footer")).toHaveAttribute(
      "data-built-by",
      "true",
    );
  });
});

describe("ValidateDataset layout (RSP-08)", () => {
  it("forces FileAnnotator's narrow (rule-C) document column via the explicit opt-in prop", () => {
    render(<ValidateDataset />);

    expect(fileAnnotatorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isAnnotable: false, narrowDocument: true }),
    );
  });

  it("renders the fluid-pane + fixed-594px-form grid, keeping the undesigned lg 50/50 fallback", () => {
    render(<ValidateDataset />);

    const grid = screen.getByTestId("file-annotator-stub")
      .parentElement as HTMLElement;
    const classes = grid.className.split(/\s+/);

    // base: single fluid column; lg (1024-1439, no design): 50/50 fallback;
    // desktop (>=1440): fluid pane + sizes.panel.form (594px) fixed column.
    expect(classes).toContain("grid-tc_[minmax(0,_1fr)]");
    expect(classes).toContain("lg:grid-tc_[repeat(2,_minmax(0,_1fr))]");
    expect(classes).toContain(
      "desktop:grid-tc_[minmax(0,_1fr)_token(sizes.panel.form)]",
    );
  });

  it("gives the document row 62% of the stacked height below lg instead of an even 50/50 split (G1 criterion 3)", () => {
    render(<ValidateDataset />);

    const grid = screen.getByTestId("file-annotator-stub")
      .parentElement as HTMLElement;
    const classes = grid.className.split(/\s+/);

    // base (<lg): the document keeps the majority of the stacked row's
    // height - the old even 50/50 split left less than a line and a half of
    // the form visible and clipped the document to ~13 lines. lg+: back to a
    // single row, since the grid becomes 2 columns there instead.
    expect(classes).toContain("grid-tr_[minmax(0,_62%)_minmax(0,_1fr)]");
    expect(classes).toContain("lg:grid-tr_[minmax(0,_1fr)]");
  });
});
