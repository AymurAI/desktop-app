import { FeatureFlowEnum } from "@/types/features";

/**
 * Width below which each tool's stepper has to be hidden, because AppHeader
 * centres it absolutely and it lands on top of a long `featureName` (issue 01,
 * mitigated by the unlayered rules in src/renderer/src/index.css — read that
 * comment for why they are unlayered and why the real fix is upstream).
 *
 * The threshold is per tool because the overlap depends on how wide the title
 * is. A single breakpoint has to be calibrated to the worst case, and doing
 * that (this was `xl`/1280px until 2026-08-03) hid the stepper on the three
 * shorter names for hundreds of pixels where they fit perfectly — visible on a
 * ~1217px window, where every tool has zero overlap and the stepper was gone
 * anyway.
 *
 * Widths at which the title↔badge intersection first reaches 0, swept in
 * Chromium at 4px steps with the mitigation neutralised:
 *
 *   Voz a Texto          ~800px    →  hidden below 840
 *   Set de Datos         ~840px    →  hidden below 880
 *   Anonimizador         ~880px    →  hidden below 920
 *   Resumen de Documento ~1048px   →  hidden below 1080
 *
 * Each value adds ~40px over its measurement, so a font fallback or slightly
 * wider glyphs cannot silently reintroduce the overlap.
 *
 * This lives in its own module rather than in header.tsx because
 * playwright/header-stepper.spec.tsx imports it, and Playwright CT cannot mount
 * a component whose import statement also carries a named export — it rewrites
 * component imports, and the mixed form makes it treat `Header` as declared in
 * the test file ("Component "Header" cannot be mounted").
 *
 * The class name carries the number rather than the tool so the CSS stays
 * mechanical: index.css needs one block per distinct value here, and the spec
 * turns red if a value has no matching rule.
 */
export const STEPPER_HIDE_BELOW: Record<
  FeatureFlowEnum,
  840 | 880 | 920 | 1080
> = {
  [FeatureFlowEnum.VoiceToText]: 840,
  [FeatureFlowEnum.Dataset]: 880,
  [FeatureFlowEnum.Anonymizer]: 920,
  [FeatureFlowEnum.Summarizer]: 1080,
};

/** The class `Header` puts on AppHeader's root for `feature`. */
export function stepperHideClass(feature: FeatureFlowEnum): string {
  return `stepper-hide-below-${STEPPER_HIDE_BELOW[feature]}`;
}
