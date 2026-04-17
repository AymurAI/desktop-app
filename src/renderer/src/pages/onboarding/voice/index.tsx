import { type ChangeEventHandler, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Button, HiddenInput, Stack, Text, Title } from "@/components";
import { useFileDispatch } from "@/hooks";
import { Footer, Section } from "@/layout/main";
import { addFiles } from "@/reducers/file/actions";

import { Card } from "../Cards";
import { Grid } from "../grid";

const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.webm,audio/*";

const STEPS: [string, string, string, string] = [
  "Subí uno o más archivos de audio (.mp3, .wav, .m4a, .webm)",
  "El sistema analiza el audio e identifica quién habla en cada momento",
  "Revisá la transcripción, editá el texto y renombrá a los locutores",
  "Descargá la transcripción en formato de texto",
];

export default function VoiceOnboarding() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    if (rawFiles) {
      const files = Array.from(rawFiles);
      dispatch(addFiles(files));
      navigate("../preview");
    }
  };

  return (
    <>
      <Section spacing="xl">
        <Stack spacing="m">
          <Title weight="strong">
            Cómo funciona la Transcripción de voz a texto
          </Title>
        </Stack>
        <Grid>
          {STEPS.map((step, index) => (
            <Card key={step} step={index + 1} text={step} />
          ))}
        </Grid>
      </Section>

      <Footer>
        <HiddenInput
          type="file"
          accept={AUDIO_ACCEPT}
          ref={inputRef}
          onChange={handleAddedFiles}
          multiple={true}
          tabIndex={-1}
        />
        <Text size="s">Formatos válidos: .mp3, .wav, .m4a, .webm</Text>
        <Button onClick={handleSelectFile} size="l">
          Cargar audio
        </Button>
      </Footer>
    </>
  );
}
