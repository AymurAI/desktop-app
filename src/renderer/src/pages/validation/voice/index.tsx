import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Button, TranscriptionEditor } from "@/components";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { Footer } from "@/layout/main";

export default function VoiceValidation() {
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const [isEditMode, setIsEditMode] = useState(false);

  // Use the first transcription (one file at a time in voice-to-text workflow)
  const transcription = transcriptions[0];

  if (!transcription) {
    // Guard: redirect back if there's no transcription (e.g. direct navigation)
    return <Navigate to="../process" replace />;
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TranscriptionEditor
          transcription={transcription}
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
      </div>
      <Footer>
        <Button
          size="l"
          variant="secondary"
          onClick={() => navigate("../process")}
        >
          Volver
        </Button>
        <Button size="l" onClick={() => navigate("../finish")}>
          Finalizar
        </Button>
      </Footer>
    </>
  );
}
