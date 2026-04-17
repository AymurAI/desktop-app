import { Bell } from "phosphor-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  SectionTitle,
  Stack,
  Subtitle,
  Text,
  Toast,
} from "@/components";
import {
  Bar,
  BarContainer,
} from "@/components/file-processing/FileProcessing.styles";
import Label from "@/components/label";
import { useFiles } from "@/hooks";
import { useTranscribe } from "@/hooks/useTranscribe";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { Footer, Section } from "@/layout/main";

export default function VoiceProcess() {
  const navigate = useNavigate();
  const files = useFiles();
  const transcriptionDispatch = useTranscriptionDispatch();

  const audioFiles = files.map((f) => f.data);

  const { progress, status } = useTranscribe(audioFiles, {
    dispatch: transcriptionDispatch,
  });

  const [isToastVisible, setIsToastVisible] = useState(false);

  const isCompleted = status === "completed";
  const isError = status === "error";
  const progressPercent = Math.round(progress * 100);

  useEffect(() => {
    if (isCompleted && !isToastVisible) {
      setIsToastVisible(true);
    }
  }, [isCompleted]);

  const handlePrevious = () => {
    navigate("../preview");
  };

  const handleNext = () => {
    navigate("../validation");
  };

  const hideToast = () => setIsToastVisible(false);

  return (
    <>
      <Section>
        <Toast isVisible={isToastVisible} onClose={hideToast} icon={<Bell />}>
          Transcripción completada
        </Toast>
        <SectionTitle onClick={handlePrevious}>
          2. Transcripción de audio
        </SectionTitle>
        <Card css={{ alignItems: "stretch" }}>
          <Stack spacing="l" direction="column">
            <Stack direction="column" spacing="xs">
              <Text>AymurAI está transcribiendo los archivos de audio</Text>
              <Subtitle size="s">
                Este proceso puede tardar algunos minutos.
              </Subtitle>
            </Stack>

            {/* Overall progress bar */}
            <Stack direction="column" align="stretch" spacing="s">
              <Stack justify="space-between">
                <Label status="default">
                  {files.length === 1
                    ? files[0].data.name
                    : `${files.length} archivos`}
                </Label>
                <Label status={isError ? "error" : "default"}>
                  {isError
                    ? "Error en la transcripción"
                    : isCompleted
                      ? "Transcripción completada 100%"
                      : `${progressPercent}%`}
                </Label>
              </Stack>
              <BarContainer>
                <Bar
                  isCompleted={isCompleted}
                  css={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                />
              </BarContainer>
            </Stack>
          </Stack>
        </Card>
      </Section>

      <Footer>
        <Button size="l" variant="secondary" onClick={handlePrevious}>
          Volver
        </Button>
        <Button size="l" disabled={!isCompleted} onClick={handleNext}>
          Siguiente
        </Button>
      </Footer>
    </>
  );
}
