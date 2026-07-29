import { ValidateDataset } from "@/components/validate-dataset";
import { FileContext } from "@/context/File";
import { buildDocFileFixture } from "./document-file";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/plan.md.
 * Not reachable from any knip entry point on purpose; see knip.json's ignore
 * list, same as smoke-box.tsx (RSP-02a).
 *
 * `ValidateDataset` reads its files from `FileContext` rather than props, so
 * a provider value stands in for `FileProvider` - the dispatch context's
 * default no-op is enough since nothing here submits the form. It also
 * imports `useNavigate`/`useParams` from `@tanstack/react-router` directly;
 * those two are stubbed for the whole CT harness via a Vite alias in
 * playwright-ct.config.ts (playwright/mocks/tanstack-router-stub.ts) rather
 * than mounting a real router, since nothing else this plan mounts imports
 * that package.
 */
export function ValidateDatasetFixture() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <FileContext.Provider value={[buildDocFileFixture()]}>
        <ValidateDataset />
      </FileContext.Provider>
    </div>
  );
}
