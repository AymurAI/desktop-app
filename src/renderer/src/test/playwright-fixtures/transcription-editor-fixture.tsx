import type { ReactNode } from "react";
import { useState } from "react";

import TranscriptionEditor from "@/components/voice-to-text/transcription-editor";
import { buildFixture } from "@/services/aymurai/fixtures/transcription";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in tasks/responsive/plan.md.
 * Not reachable from any knip entry point on purpose; see knip.json's ignore
 * list, same as validate-dataset-fixture.tsx (RSP-02a).
 */
interface TranscriptionEditorFixtureProps {
  // Default MUST stay `true`: transcription-editor.spec.tsx and
  // side-panel-stacking.spec.tsx both mount this fixture with no prop and
  // depend on starting in edit mode (see G1 T3's ticket notes).
  initialEditMode?: boolean;
  // G5 T2: optional so every EXISTING test (which never passed this) keeps
  // rendering the player's `rightSlot` empty exactly as before. Added so a
  // test can mount a real "Finalizar"-shaped node (matching
  // voice-to-text/validation.tsx's real usage) to verify criterion 5 - the
  // player and that button's vertical centers must stay aligned once the
  // player's content gets its own padding-inline.
  footerActions?: ReactNode;
}
export function TranscriptionEditorFixture({
  initialEditMode = true,
  footerActions,
}: TranscriptionEditorFixtureProps = {}) {
  const [transcription] = useState(() =>
    buildFixture(new File([new Uint8Array(1)], "audiencia.webm")),
  );
  const [isEditMode, setIsEditMode] = useState(initialEditMode);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <TranscriptionEditor
        transcription={transcription}
        isEditMode={isEditMode}
        onEditModeChange={setIsEditMode}
        footerActions={footerActions}
      />
    </div>
  );
}
