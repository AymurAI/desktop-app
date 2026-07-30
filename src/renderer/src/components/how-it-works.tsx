import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { Stack } from "@/styled/jsx";
import { type FeatureFlowEnum, featureNamespace } from "@/types/features";
import { TutorialGrid, type TutorialStep } from "@aymurai/ui";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type FeatureTutorialT = TFunction<(typeof featureNamespace)[FeatureFlowEnum]>;

/**
 * G2 (tasks/responsive-fixes/issues/G2-onboarding-grid-modal.md), issue 02:
 * `@aymurai/ui`'s `TutorialGrid` collapses to 1 column at `md` (768px), not
 * below it (`dist/index.js`'s grid recipe: `gridTemplateColumns: {base:
 * "1fr", md: "repeat(2, 1fr)"}` - Panda's `md` is a 768px MIN-width, so 768
 * is the first width that does NOT collapse), and centers each card's
 * content vertically (`alignItems: "center"` on the CARD recipe, not the
 * row) - with cards of uneven description length that misaligns sibling
 * titles/numbers by up to 30.8px at 768.
 *
 * This is exported so both the page (here) and the modal (`how-it-works-
 * modal.tsx`, G2 issue 03) apply the SAME override to the SAME
 * `TutorialGrid` - one fix, not two divergent ones.
 *
 * WHY THIS CANNOT BE A PLAIN `css()`: `main.tsx` imports `./index.css`
 * BEFORE `@aymurai/ui/styles.css`, and both stylesheets declare the
 * identical `@layer reset, base, tokens, recipes, utilities;` - so within
 * the shared `utilities` layer, a plain single-class override and the
 * library's own single-class rule tie in specificity (0,1,0), and the
 * library wins the tie because its stylesheet is imported (and therefore
 * appears later in the cascade) after ours. Measured: a plain
 * `gridTemplateColumns` override is silently INERT at 768 (stays at
 * `360.125px 383.875px`, i.e. 2 tracks) without failing anything - exactly
 * the silent-regression shape this ticket exists to prevent. Fixing the
 * import order in `main.tsx` would be the architecturally cleaner move
 * (consumer should be able to override the library), but it changes the
 * cascade for every `@aymurai/ui` component in the app at once - out of
 * scope here.
 *
 * The fix has two different mechanisms because the two defects live on two
 * different elements:
 * - `gridTemplateColumns` targets the grid ROOT, where our override and the
 *   library's rule are equally specific (0,1,0) - so it's wrapped in `"&&"`
 *   (Panda emits `.class.class`, specificity (0,2,0)) to win the tie
 *   regardless of import/layer order, without touching `main.tsx`.
 * - `alignItems` is centered on the CARD recipe (a child `div` of the grid
 *   root - `className` only ever lands on the root), so a plain `"&
 *   > div"` direct-child selector already outguns the card's own
 *   single-class rule on specificity alone (0,1,1) > (0,1,0) - no `&&`
 *   needed there. This is a structural selector (every step renders as a
 *   direct child `div`, verified in `dist/index.js`), NOT a selector against
 *   an `aym-*` minified class name, which the contract forbids because it
 *   breaks on the next package bump.
 *
 * `lg` (1024px), not the ~900px the contract suggests: there is no 900
 * token, and adding one means touching `panda.config.ts` plus a codegen run
 * for a plan this narrow in scope. `lg` collapses the whole 768-1023 range,
 * which is MORE conservative than asked and still satisfies "no paragraph
 * under 4 words per line at 768" with margin.
 *
 * If `@aymurai/ui` is ever bumped to fix this upstream (ideal: `md` ->
 * `lg`, `1fr` -> `minmax(0, 1fr)`, `alignItems: center` -> `flex-start` on
 * the card recipe), this override becomes redundant but harmless - both
 * rules are idempotent - so it can simply be deleted then. Do not
 * "simplify" this back to a plain `css()` in the meantime: that silently
 * reintroduces issue 02(a).
 */
export const tutorialGridOverride = css({
  "&&": {
    // `1fr` is `minmax(auto, 1fr)`; with the card's image fixed at
    // `w: "[200px]" flexShrink: "0"` (recipe `mE`), an auto-sized track
    // floor lets a track grow past its share and overflow (issue 03's modal
    // clip and the related Set de Datos page overflow) - `minmax(0, 1fr)`
    // floors each track at 0 so it only ever grows, never overflows.
    gridTemplateColumns: {
      base: "[1fr]",
      lg: "[repeat(2, minmax(0, 1fr))]",
    },
  },
  "& > div": {
    alignItems: "flex-start",
  },
});

export function buildTutorialSteps(tFeature: FeatureTutorialT): TutorialStep[] {
  return ([1, 2, 3, 4] as const).map((step) => ({
    image: `${import.meta.env.BASE_URL}onboarding-steps/step${step}.png`,
    imageAlt: tFeature(`howItWorks.step${step}.alt`),
    title: tFeature(`howItWorks.step${step}.title`),
    description: tFeature(`howItWorks.step${step}.subtitle`),
  }));
}

interface HowItWorksProps {
  title?: ReactNode;
  feature: FeatureFlowEnum;
}

export default function HowItWorks({ title, feature }: HowItWorksProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);
  const renderedTitle =
    typeof title === "string" ? (
      <SectionTitle>{title}</SectionTitle>
    ) : (
      (title ?? <SectionTitle>{t("howItWorks")}</SectionTitle>)
    );

  return (
    <Stack gap="6">
      {renderedTitle}
      <TutorialGrid
        steps={buildTutorialSteps(tFeature)}
        className={tutorialGridOverride}
      />
    </Stack>
  );
}
