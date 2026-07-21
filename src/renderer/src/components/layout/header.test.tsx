import { FeatureFlowEnum } from "@/types/features";
import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./header";

let tutorialSeen = false;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/store/useLocal", () => ({
  useTutorialSeen: () => tutorialSeen,
}));

vi.mock("../features-menu", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="apps-trigger">{trigger}</div>
  ),
}));

vi.mock("../how-it-works-modal", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="help-trigger">{trigger}</div>
  ),
}));

describe("document Header", () => {
  beforeEach(() => {
    tutorialSeen = false;
  });

  it("maps document steps to AppHeader's zero-based progress", () => {
    render(
      <Header
        title="Set de Datos"
        feature={FeatureFlowEnum.Dataset}
        currentStep={3}
      />,
    );

    const progress = screen.getByRole("list", { name: "Progress" });
    expect(progress.querySelectorAll('[role="listitem"]')).toHaveLength(4);
    expect(
      screen.getByText("stepper.validation").closest('[role="listitem"]'),
    ).toHaveAttribute("aria-current", "step");
  });

  it("shows the module help trigger only after its tutorial was seen", () => {
    tutorialSeen = true;
    render(
      <Header title="Anonimizador" feature={FeatureFlowEnum.Anonymizer} />,
    );

    expect(screen.getByTestId("help-trigger")).toContainElement(
      screen.getByLabelText("howItWorks"),
    );
    expect(screen.getByTestId("apps-trigger")).toContainElement(
      screen.getByLabelText("header.appsAria"),
    );
    expect(
      screen.getByRole("link", { name: "header.homeAria" }),
    ).not.toHaveTextContent("Anonimizador");
    expect(
      screen.getByRole("link", { name: "header.homeAria" }),
    ).not.toContainElement(screen.getByText("Anonimizador"));
  });

  it("hides the VTT help trigger until its tutorial was seen", () => {
    render(<Header feature={FeatureFlowEnum.VoiceToText} currentStep={3} />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(
      screen.getByText("stepper.step3").closest('[role="listitem"]'),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.queryByTestId("help-trigger")).toBeNull();
  });

  it("uses the shared help modal after the VTT tutorial was seen", () => {
    tutorialSeen = true;
    render(<Header feature={FeatureFlowEnum.VoiceToText} currentStep={3} />);

    expect(screen.getByTestId("help-trigger")).toContainElement(
      screen.getByLabelText("howItWorks.helpAria"),
    );
  });

  it("renders the home header without progress or module help", () => {
    render(<Header />);

    expect(screen.queryByRole("list", { name: "Progress" })).toBeNull();
    expect(screen.queryByTestId("help-trigger")).toBeNull();
    expect(
      screen.getByRole("link", { name: "header.homeAria" }),
    ).toHaveAttribute("href", "/home/features");
    expect(
      document.querySelector('svg[viewBox="48 7 109 25.2"]'),
    ).not.toBeNull();
  });
});
