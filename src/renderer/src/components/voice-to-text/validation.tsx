import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import BackButton from "@/components/ui/back-button";
import { USE_MOCK_STT } from "@/constants/config";
import RequireFile from "@/features/RequireFile";
import { showToast } from "@/features/showToast";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { saveValidation } from "@/services/aymurai/queries";
import { css } from "@/styled/css";
import { HStack, Stack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button } from "@aymurai/ui";
import TranscriptionEditor from "./transcription-editor";

const editorWrap = css({
  flex: "[1]",
  overflow: "hidden",
  display: "flex",
  flexDir: "column",
});

export default function VoiceValidation() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const [isEditMode, setIsEditMode] = useState(false);

  const transcription = transcriptions[0];

  const saveMutation = useMutation(saveValidation());

  const handleFinish = async () => {
    if (!USE_MOCK_STT && transcription) {
      try {
        await saveMutation.mutateAsync(transcription);
      } catch {
        showToast(t("validation.saveFailed"), "warning");
      }
    }
    navigate({
      to: "/app/$feature/finish",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });
  };

  if (!transcription) {
    return (
      <RequireFile>
        <Header feature={FeatureFlowEnum.VoiceToText} currentStep={3} />
        <Footer>
          <HStack gap="4">
            <BackButton
              to="/app/$feature/process"
              params={{ feature: FeatureFlowEnum.VoiceToText }}
            />
          </HStack>
        </Footer>
      </RequireFile>
    );
  }

  return (
    <RequireFile>
      <Stack gap="0" height="[100dvh]" overflow="hidden">
        <Header feature={FeatureFlowEnum.VoiceToText} currentStep={3} />
        <div className={editorWrap}>
          <TranscriptionEditor
            transcription={transcription}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            footerActions={
              <Button onClick={handleFinish} disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? t("validation.saving")
                  : t("editor.finish")}
              </Button>
            }
          />
        </div>
      </Stack>
    </RequireFile>
  );
}
