import TurnSidePanel from "@/components/voice-to-text/transcription-editor/turn-side-panel";
import type { Transcription } from "@/types/transcription";

/**
 * Mounted only by the Playwright CT screen specs (playwright/*.spec.tsx),
 * never imported from the app itself - see RSP-02b in
 * tasks/responsive/plan.md. Not reachable from any knip entry point on
 * purpose; see knip.json's ignore list.
 *
 * `TurnSidePanel` reads `useTranscriptionDispatch()`, whose context default
 * is a no-op function (`context/Transcription.tsx`), so this mounts the
 * panel directly with no providers - the panel already wraps its own
 * `TooltipProvider` internally.
 */
export function buildTurnFixture(speakerLabel: string): {
  transcription: Transcription;
  activeTurnId: string;
} {
  const speaker = {
    id: "speaker-1",
    label: speakerLabel,
    initials: "AB",
    color: "violet" as const,
  };
  const turn = {
    id: "turn-1",
    speakerId: speaker.id,
    text: "Contenido de prueba del turno.",
    startMs: 0,
    endMs: 2000,
  };

  return {
    transcription: {
      id: "transcription-1",
      title: "Audiencia de prueba",
      audioFileName: "audiencia.webm",
      audioDurationMs: 5000,
      audioObjectUrl: "blob:preview",
      speakers: [speaker],
      turns: [turn],
      source: "asr",
      createdAt: new Date(0).toISOString(),
    },
    activeTurnId: turn.id,
  };
}

export function TurnSidePanelFixture({
  speakerLabel,
}: {
  speakerLabel: string;
}) {
  const { transcription, activeTurnId } = buildTurnFixture(speakerLabel);

  return (
    <div style={{ height: "100vh" }}>
      <TurnSidePanel
        transcription={transcription}
        activeTurnId={activeTurnId}
      />
    </div>
  );
}
