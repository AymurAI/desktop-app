import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import VoiceHeader from "./header";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/components/features-menu", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="apps-trigger">{trigger}</div>
  ),
}));

vi.mock("./how-it-works", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="help-trigger">{trigger}</div>
  ),
}));

describe("VoiceHeader", () => {
  it("maps VTT step numbers to the zero-based AppHeader progress", () => {
    render(<VoiceHeader currentStep={3} />);

    const progress = screen.getByRole("list", { name: "Progress" });
    expect(progress.querySelectorAll('[role="listitem"]')).toHaveLength(4);
    expect(screen.getByText("stepper.step3")).toBeTruthy();
    expect(
      screen.getByText("stepper.step3").closest('[role="listitem"]'),
    ).toHaveAttribute("aria-current", "step");
  });

  it("omits progress and wraps logo, help and apps with VTT integrations", () => {
    render(<VoiceHeader />);

    expect(screen.queryByRole("list", { name: "Progress" })).toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/home/features");
    expect(screen.getByTestId("help-trigger")).toContainElement(
      screen.getByLabelText("howItWorks.helpAria"),
    );
    expect(screen.getByTestId("apps-trigger")).toContainElement(
      screen.getByLabelText("header.appsAria"),
    );
  });
});
