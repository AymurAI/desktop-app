import FileAnnotator from "@/components/file-annotator";
import { buildDocFileFixture } from "./document-file";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/plan.md.
 * Not reachable from any knip entry point on purpose; see knip.json's ignore
 * list, same as transcription-editor-fixture.tsx (RSP-02a).
 *
 * `isAnnotable` starts the entities (label manager) panel open, mirroring
 * the real Anonimizador validation screen.
 */
export function FileAnnotatorFixture() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <FileAnnotator file={buildDocFileFixture()} isAnnotable />
    </div>
  );
}
