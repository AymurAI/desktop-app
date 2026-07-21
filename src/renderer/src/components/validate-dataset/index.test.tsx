import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ValidateDataset } from "./index";

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
vi.mock("../file-annotator", () => ({ default: () => null }));
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
