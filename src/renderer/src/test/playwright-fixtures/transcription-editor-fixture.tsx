import { useState } from "react";

import TranscriptionEditor from "@/components/voice-to-text/transcription-editor";
import { buildFixture } from "@/services/aymurai/fixtures/transcription";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/plan.md.
 * Not reachable from any knip entry point on purpose; see knip.json's ignore
 * list, same as validate-dataset-fixture.tsx (RSP-02a).
 */
export function TranscriptionEditorFixture() {
  const [transcription] = useState(() =>
    buildFixture(new File([new Uint8Array(1)], "audiencia.webm")),
  );
  const [isEditMode, setIsEditMode] = useState(true);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <TranscriptionEditor
        transcription={transcription}
        isEditMode={isEditMode}
        onEditModeChange={setIsEditMode}
      />
    </div>
  );
}
