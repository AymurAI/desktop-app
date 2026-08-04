import { type SummaryState, useSummary } from "@/context/Summary";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RequireSummary from "./RequireSummary";

vi.mock("@/context/Summary", () => ({
  useSummary: vi.fn(),
}));

function makeSummaryState(overrides: Partial<SummaryState>): SummaryState {
  return {
    status: "idle",
    sourceFileName: null,
    title: "",
    partialText: "",
    document: null,
    error: null,
    ...overrides,
  };
}

vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ feature: "SUMMARIZER" }),
  Navigate: ({
    to,
    params,
  }: {
    to: string;
    params: Record<string, string>;
  }) => (
    <div
      data-testid="navigate"
      data-to={to.replace("$feature", params.feature)}
    />
  ),
}));

const mockedUseSummary = vi.mocked(useSummary);

describe("RequireSummary", () => {
  it("redirects to the process screen when there is no summary document yet", () => {
    mockedUseSummary.mockReturnValue(
      makeSummaryState({ status: "idle", document: null }),
    );

    render(
      <RequireSummary>
        <div>protected content</div>
      </RequireSummary>,
    );

    const redirect = screen.getByTestId("navigate");
    expect(redirect).toHaveAttribute("data-to", "/app/SUMMARIZER/process");
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("redirects to the process screen when status is completed but the document is missing", () => {
    mockedUseSummary.mockReturnValue(
      makeSummaryState({ status: "completed", document: null }),
    );

    render(
      <RequireSummary>
        <div>protected content</div>
      </RequireSummary>,
    );

    expect(screen.getByTestId("navigate")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders the protected content once a summary document is completed", () => {
    mockedUseSummary.mockReturnValue(
      makeSummaryState({
        status: "completed",
        document: { type: "doc", content: [] },
      }),
    );

    render(
      <RequireSummary>
        <div>protected content</div>
      </RequireSummary>,
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});
