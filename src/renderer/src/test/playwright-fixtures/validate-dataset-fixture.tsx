import Header from "@/components/layout/header";
import { ValidateDataset } from "@/components/validate-dataset";
import { FileContext } from "@/context/File";
import { FeatureFlowEnum } from "@/types/features";
import { buildDocFileFixture } from "./document-file";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/plan.md.
 * Not reachable from any knip entry point on purpose; see knip.json's ignore
 * list, same as file-annotator-fixture.tsx (RSP-02a).
 *
 * `ValidateDataset` reads its files from `FileContext` rather than props, so
 * a provider value stands in for `FileProvider` - the dispatch context's
 * default no-op is enough since nothing here submits the form. It also
 * imports `useNavigate`/`useParams` from `@tanstack/react-router` directly;
 * those two are stubbed for the whole CT harness via a Vite alias in
 * playwright-ct.config.ts (playwright/mocks/tanstack-router-stub.ts) rather
 * than mounting a real router, since nothing else this plan mounts imports
 * that package.
 *
 * G1/T6: the wrapper must be a `display: flex; flexDirection: column`
 * container with a DEFINITE height, matching the real shell's
 * `<Stack width="full" height="[100dvh]" overflow="hidden">` in
 * routes/app.$feature/route.tsx - `ValidateDataset`'s own `Grid` uses
 * `flex="1"` (validate-dataset/index.tsx:70) to split the viewport between
 * the document and the footer, and `flex: 1` is INERT under a `display:
 * block` parent (a plain `height: 100vh` div, which is what this fixture
 * used to be): a block-level child is not a flex item, so the Grid's height
 * stayed undefined and its `1fr` row tracks sized themselves by content
 * instead of splitting the viewport - the exact reason the criterion-3 defect
 * (the document pane swallowing the whole viewport at 768, pushing the "3.
 * Validación de datos" form off-screen) never showed up in this harness.
 * `file-annotator-fixture.tsx` uses the same block wrapper and does NOT need
 * this change, because `FileAnnotator` sizes itself with `h: "full"` (a
 * percentage against a parent with a definite height), not `flex: 1`.
 *
 * G1/T7: mounts the real `Header` above `ValidateDataset`, exactly as
 * routes/app.$feature/validation.tsx's `DocumentValidation` does (`<Header
 * .../><ValidateDataset /></RequireFile>`, `RequireFile` returns its children
 * with no wrapper). It used to be deliberately omitted on the theory that it
 * would drag in i18n/router context this harness avoids - both were already
 * present (i18n is initialized globally in playwright/index.tsx; the router
 * import surface just needed `Link` added to the stub, for
 * `HeaderLogoLink`). Omitting it made every pixel threshold below (G1
 * criterion 3, the document-scroller minimum-height check in
 * validate-dataset.spec.tsx) measure a pane taller than the real screen's by
 * the Header's own height, eating most of the threshold's calibrated margin
 * - see that spec for the corrected numbers now that the Header is here.
 */
export function ValidateDatasetFixture() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <FileContext.Provider value={[buildDocFileFixture()]}>
        <Header feature={FeatureFlowEnum.Dataset} currentStep={3} />
        <ValidateDataset />
      </FileContext.Provider>
    </div>
  );
}
