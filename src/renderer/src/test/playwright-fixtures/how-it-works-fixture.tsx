import HowItWorks from "@/components/how-it-works";
import MainContent from "@/components/layout/main-content";
import { FeatureFlowEnum } from "@/types/features";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/
 * plan.md. Not reachable from any knip entry point except the spec that
 * imports it, same as the other *-fixture.tsx files here.
 *
 * Replicates the REAL composition of routes/app.$feature/onboarding.tsx
 * (`<MainContent full={tutorialSeen}>` wrapping `<HowItWorks feature={...}
 * />` when `tutorialSeen` is false, i.e. `full={false}`) rather than
 * mounting `HowItWorks` bare, because `full={false}` is what gives the
 * `<main>` its real content box - `px: {base:4, sm:6, md:8, desktop:12}` on
 * the `<main>` itself plus `maxWidth: content.max` + `mx: auto` on the inner
 * wrapper (main-content.tsx) - which is exactly what G2's criterion 4
 * (`document.documentElement.scrollWidth <= window.innerWidth`) measures.
 * `MainContent` has no router/QueryClient dependency (pure presentational),
 * so this fixture can mount it directly, same as the real route does.
 *
 * `feature` defaults to Anonymizer but is a prop so the spec can mount it
 * per-feature: G2's criterion 2 (vertical misalignment between sibling
 * `<h2>`s) only measures something real when the card descriptions have
 * different lengths, which the mocked `namespace:key` strings used by
 * how-it-works.test.tsx (near-uniform length) would not exercise - this
 * fixture relies on the REAL locale strings instead, since i18n is
 * initialized globally in playwright/index.tsx.
 */
interface HowItWorksFixtureProps {
  feature?: FeatureFlowEnum;
}

export function HowItWorksFixture({
  feature = FeatureFlowEnum.Anonymizer,
}: HowItWorksFixtureProps) {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MainContent full={false}>
        <HowItWorks feature={feature} />
      </MainContent>
    </div>
  );
}
