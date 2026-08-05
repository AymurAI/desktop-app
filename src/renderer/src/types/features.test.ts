import { describe, expect, it } from "vitest";
import { FeatureFlowEnum, featureNamespace } from "./features";

describe("FeatureFlowEnum", () => {
  it("includes the Recomendaciones flow with its i18n namespace", () => {
    expect(FeatureFlowEnum.Recomendaciones).toBe("RECOMENDACIONES");
    expect(featureNamespace[FeatureFlowEnum.Recomendaciones]).toBe(
      "recomendaciones",
    );
  });
});
