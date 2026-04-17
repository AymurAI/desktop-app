import { useNavigate } from "react-router-dom";

import { Button, Card, SectionTitle, Stack, Subtitle, Text } from "@/components";
import { formatTime } from "@/components/audio-player/formatTime";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { Footer, Section } from "@/layout/main";

export default function VoiceFinish() {
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0];

  const handleDownloadTxt = () => {
    if (!transcription) return;

    const lines = transcription.turns.map((turn) => {
      const speaker = transcription.speakers.find((s) => s.id === turn.speakerId);
      const time = formatTime(turn.startMs);
      return `[${time}] ${speaker?.label ?? "Locutor"}: ${turn.text}`;
    });

    const content = lines.join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transcription.title.replace(/[^a-zA-Z0-9\s]/g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Section>
        <SectionTitle>4. Finalización</SectionTitle>
        {transcription ? (
          <>
            <Text css={{ maxWidth: "60%" }}>
              La transcripción ha sido completada y revisada. Podés descargarla
              como archivo de texto.
            </Text>
            <Card>
              <Subtitle>Resumen de la transcripción</Subtitle>
              <Stack direction="column" spacing="xs">
                <Text>
                  <strong>Título:</strong> {transcription.title}
                </Text>
                <Text>
                  <strong>Archivo:</strong> {transcription.audioFileName}
                </Text>
                <Text>
                  <strong>Locutores:</strong> {transcription.speakers.length}
                </Text>
                <Text>
                  <strong>Turnos:</strong> {transcription.turns.length}
                </Text>
              </Stack>
            </Card>
          </>
        ) : (
          <Text>No se encontró ninguna transcripción.</Text>
        )}
      </Section>
      <Footer>
        <Button size="l" variant="secondary" onClick={() => navigate("../validation")}>
          Volver
        </Button>
        <Button size="l" disabled={!transcription} onClick={handleDownloadTxt}>
          Descargar .txt
        </Button>
      </Footer>
    </>
  );
}
