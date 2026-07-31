import { FilePreview } from "@/components";
import FileSelectionLayout from "@/components/layout/file-selection-layout";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import { Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Card } from "@aymurai/ui";
import { useTranslation } from "react-i18next";
import { buildDocFileFixture } from "./document-file";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see the other *-fixture.tsx files
 * here for the same convention.
 *
 * G4/T4 (tasks/responsive-fixes/issues/G4-anchos-fijos-y-truncados.md,
 * criterio 4): what fixes the "Vista previa del documento" card's max-width
 * at 2560 is the layout CHAIN around it - `MainContent full` (which applies
 * no cap of its own) nested in `FileSelectionLayout` (whose `content` class
 * applies `maxWidth: "content.max"` + `mx: "auto"` to the `Stack` that wraps
 * the title row AND the children, file-selection-layout.tsx:16-20) - not any
 * width on the `Card` itself. This fixture reproduces that chain, prop for
 * prop, instead of mounting the real route (`routes/app.$feature/preview.tsx`),
 * which would drag in `createFileRoute`/`RequireFile`/`FileContext`/
 * `useFileParse` - none of which affect the Card's horizontal width - and
 * `createFileRoute` isn't even stubbed for this harness (see
 * playwright/mocks/tanstack-router-stub.ts), so mounting the route module
 * would crash at import.
 *
 * Deliberate departures from the real `DocumentPreview` component
 * (preview.tsx:35-93), and why none of them affect the measured width:
 *   - No `RequireFile` wrapper: a route guard that renders its children with
 *     no wrapper element once files are present (see validate-dataset-
 *     fixture.tsx's docblock) - inert for layout either way.
 *   - No `Header`/`Footer`: both are siblings of `MainContent` in a column
 *     flex shell (`routes/app.$feature/route.tsx`), not ancestors of it, so
 *     neither influences `MainContent`'s width.
 *   - `FilePreview`'s `status` is hardcoded to `"completed"` and `onRemove`
 *     is a no-op, instead of being driven by `useFileParse`/`useFileDispatch`
 *     - both are pure behavior with no effect on the Card's width (and
 *     `FilePreview` caps its own content at `maxW: "[367px]"` regardless of
 *     status, file-preview/index.tsx:29, so it never pushes the Card wider
 *     than the cap - it's the Card, not `FilePreview`, that stretches to
 *     fill `FileSelectionLayout`'s capped `Stack`, since `Card` is a plain
 *     `<div>` with no width of its own, dist/index.js:2289-2295, and a flex
 *     column's default `align-items: normal` stretches block children to
 *     the container's cross-axis width).
 *   - `BackButton`'s `to`/`params` point at a fixed, plausible route instead
 *     of reading `useParams` - `BackButton` renders a small fixed-size icon
 *     link, unrelated to the measured Card's width.
 *   - The feature is hardcoded to `FeatureFlowEnum.Anonymizer` (the
 *     `/app/ANONYMIZER/preview` route the contract names) instead of being
 *     read from the URL.
 */
export function PreviewFixture() {
  const { t } = useTranslation("anonymizer");
  const file = buildDocFileFixture();

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MainContent full>
        <FileSelectionLayout
          title={t("preview.sectionTitle")}
          backButton={
            <BackButton
              to="/app/$feature/onboarding"
              params={{ feature: FeatureFlowEnum.Anonymizer }}
            />
          }
        >
          <Card data-testid="preview-card">
            <Stack gap="8" alignItems="center">
              <styled.h2 textStyle="subtitle.md.default" alignSelf="flex-start">
                {t("preview.filesLabel")}
              </styled.h2>
              <FilePreview file={file} status="completed" onRemove={() => {}} />
            </Stack>
          </Card>
        </FileSelectionLayout>
      </MainContent>
    </div>
  );
}
