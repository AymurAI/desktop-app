import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Button, TranscriptionEditor } from "@/components";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { Footer } from "@/layout/main";
import { saveValidation } from "@/services/aymurai/asrValidation";
import { USE_MOCK_STT } from "@/utils/config";

export default function VoiceValidation() {
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const transcription = transcriptions[0];

  if (!transcription) {
    return <Navigate to="../process" replace />;
  }

  const handleFinish = async () => {
    if (!USE_MOCK_STT) {
      try {
        setIsSaving(true);
        await saveValidation(transcription);
      } catch {
        // Best-effort — don't block navigation on save failure
      } finally {
        setIsSaving(false);
      }
    }
    navigate("../finish");
  };

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
        <Button size="l" onClick={handleFinish} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Finalizar"}
        </Button>
      </Footer>
    </>
  );
}
