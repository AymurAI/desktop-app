import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureFlowEnum } from "@/types/features";
import HowItWorks from "./how-it-works";

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
});
