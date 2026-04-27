import { Bell } from "phosphor-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { keyframes, styled } from "@/styles";

const scrollUp = keyframes({
  "0%": { transform: "translateY(100%)" },
  "100%": { transform: "translateY(-100%)" },
});

const PreviewViewport = styled("div", {
  position: "relative",
  alignSelf: "stretch",
  width: "100%",
  height: "240px",
  overflow: "hidden",
  border: "1px solid #E5E3E0",
  borderRadius: "8px",
  padding: "20px 24px",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  boxSizing: "border-box",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
});

const PreviewTrack = styled("div", {
  position: "absolute",
  left: "24px",
  right: "24px",
  fontFamily: "$primary",
  fontWeight: 300,
  fontSize: "18px",
  lineHeight: "30px",
  color: "#625C68",
  whiteSpace: "pre-wrap",
  willChange: "transform",
  animationName: `${scrollUp}`,
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
});

const PreviewPlaceholder = styled("span", {
  position: "absolute",
  inset: "20px 24px",
  fontFamily: "$primary",
  fontWeight: 300,
  fontSize: "18px",
  lineHeight: "30px",
  color: "#9F99A5",
  fontStyle: "italic",
});

// ~25ms per character so the preview scrolls at a brisk but readable pace,
// clamped so very short or very long texts still feel right.
function estimateScrollDuration(text: string): number {
  const chars = text.length || 1;
  return Math.max(6, Math.min(40, chars * 0.025));
}

export default function VoiceProcess() {
  const navigate = useNavigate();
  const files = useFiles();
  const transcriptionDispatch = useTranscriptionDispatch();

  const audioFiles = useMemo(() => files.map((f) => f.data), [files]);

  const { progress, status, partialText } = useTranscribe(audioFiles, {
    dispatch: transcriptionDispatch,
  });

  const [isToastVisible, setIsToastVisible] = useState(false);

  const isCompleted = status === "completed";
  const isError = status === "error";
  const isProcessing = status === "processing";
  const progressPercent = Math.round(progress * 100);

  // Show the latest partial text in the preview, but only swap it in once the
  // current scroll loop completes — otherwise each SSE update would cut the
  // animation mid-flight and (with very frequent updates) leave the track
  // perpetually starting from off-screen, looking blank.
  const [displayedText, setDisplayedText] = useState("");
  const pendingTextRef = useRef("");

  useEffect(() => {
    pendingTextRef.current = partialText;
    // First text ever — start the loop immediately rather than waiting for an
    // iteration boundary that doesn't exist yet.
    if (partialText && !displayedText) {
      setDisplayedText(partialText);
    }
  }, [partialText, displayedText]);

  // Reset preview state when transcription finishes or restarts.
  useEffect(() => {
    if (!isProcessing) {
      setDisplayedText("");
      pendingTextRef.current = "";
    }
  }, [isProcessing]);

  const previewDuration = useMemo(
    () => estimateScrollDuration(displayedText),
    [displayedText],
  );

  const handleTrackIteration = () => {
    if (pendingTextRef.current && pendingTextRef.current !== displayedText) {
      setDisplayedText(pendingTextRef.current);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only fire when completion changes, not on every isToastVisible toggle
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
        <Card css={{ alignItems: "stretch", width: "100%" }}>
          <Stack
            spacing="l"
            direction="column"
            align="stretch"
            css={{ width: "100%" }}
          >
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

              {isProcessing && (
                <PreviewViewport
                  aria-live="polite"
                  aria-label="Vista previa de la transcripción"
                >
                  {displayedText ? (
                    <PreviewTrack
                      css={{ animationDuration: `${previewDuration}s` }}
                      onAnimationIteration={handleTrackIteration}
                    >
                      {displayedText}
                    </PreviewTrack>
                  ) : (
                    <PreviewPlaceholder>
                      Esperando las primeras palabras…
                    </PreviewPlaceholder>
                  )}
                </PreviewViewport>
              )}
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
