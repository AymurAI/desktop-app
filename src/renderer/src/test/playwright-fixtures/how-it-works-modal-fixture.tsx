import HowItWorks from "@/components/how-it-works";
import HowItWorksModal from "@/components/how-it-works-modal";
import MainContent from "@/components/layout/main-content";
import { FeatureFlowEnum } from "@/types/features";
import { TooltipProvider } from "@aymurai/ui";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see the other *-fixture.tsx files
 * here for the same convention. G2 issue 03
 * (tasks/responsive-fixes/issues/G2-onboarding-grid-modal.md): mounts BOTH
 * the page's `HowItWorks` (inside `MainContent full={false}`, same as
 * `how-it-works-fixture.tsx`) and `HowItWorksModal`'s trigger side by side,
 * wrapped in `TooltipProvider` (App.tsx wraps the whole app in one; the
 * modal's `Tooltip`/`TooltipTrigger` need that ancestor to render at all).
 * Having both in the SAME mount is what lets criterion 6 (same `TutorialGrid`
 * + same `tutorialGridOverride` on both surfaces) be checked directly by
 * comparing the two rendered grid nodes, rather than trusting the import
 * graph.
 *
 * `DialogContent` portals to `document.body` (see how-it-works-modal.tsx),
 * so the opened dialog lives OUTSIDE this component's mounted root - the
 * spec must locate it via `page.locator`, not `component.locator`.
 *
 * `feature` defaults to Anonymizer but is a prop - exact mirror of
 * `how-it-works-fixture.tsx`'s - forwarded to BOTH surfaces this fixture
 * mounts, so criterion 6's page-vs-modal grid comparison always compares two
 * grids of the SAME feature.
 */
interface HowItWorksModalFixtureProps {
  feature?: FeatureFlowEnum;
}

export function HowItWorksModalFixture({
  feature = FeatureFlowEnum.Anonymizer,
}: HowItWorksModalFixtureProps) {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <TooltipProvider>
        <MainContent full={false}>
          <HowItWorks feature={feature} />
        </MainContent>
        <HowItWorksModal feature={feature} />
      </TooltipProvider>
    </div>
  );
}
