import { TooltipProvider } from "@aymurai/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureFlowEnum } from "@/types/features";
import HowItWorks from "./how-it-works";
import HowItWorksModal from "./how-it-works-modal";

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

describe("HowItWorks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [FeatureFlowEnum.Dataset, "dataset"],
    [FeatureFlowEnum.Anonymizer, "anonymizer"],
    [FeatureFlowEnum.VoiceToText, "voice-to-text"],
  ])("uses the %s namespace for every feature step", (feature, namespace) => {
    render(<HowItWorks feature={feature} />);

    expect(screen.getByText("common:howItWorks")).toBeInTheDocument();
    for (const step of [1, 2, 3, 4]) {
      expect(
        screen.getByText(`${namespace}:howItWorks.step${step}.title`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${namespace}:howItWorks.step${step}.subtitle`),
      ).toBeInTheDocument();
    }
  });

  it("opens the shared tutorial dialog from the supplied trigger", () => {
    render(
      <TooltipProvider>
        <HowItWorksModal
          feature={FeatureFlowEnum.Dataset}
          trigger={<button type="button">open tutorial</button>}
        />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open tutorial" }));

    expect(
      screen.getByRole("heading", { name: "common:howItWorks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dataset:howItWorks.step1.title"),
    ).toBeInTheDocument();
  });
});
