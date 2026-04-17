import { FileAudio, Trash } from "phosphor-react";
import { type ChangeEventHandler, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  HiddenInput,
  SectionTitle,
  Stack,
  Subtitle,
  Text,
} from "@/components";
import { useFileDispatch, useFiles } from "@/hooks";
import { Footer, Section } from "@/layout/main";
import { addFiles, removeAllFiles, removeFile } from "@/reducers/file/actions";

const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.webm,audio/*";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

export default function VoicePreview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const files = useFiles();
  const dispatch = useFileDispatch();

  const handlePrevious = () => {
    dispatch(removeAllFiles());
    navigate("../onboarding");
  };

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    if (rawFiles) {
      const fileArray = Array.from(rawFiles);
      dispatch(addFiles(fileArray));
    }
  };

  const handleRemoveFile = (fileName: string) => () => {
    dispatch(removeFile(fileName));
  };

  const handleConfirmFiles = () => {
    navigate("../process");
  };

  return (
    <>
      <Section spacing="xl">
        <SectionTitle onClick={handlePrevious}>
          1. Archivos de audio
        </SectionTitle>
        <Card>
          <Subtitle>Archivos seleccionados</Subtitle>
          <Stack direction="column" spacing="s" css={{ width: "100%" }}>
            {files.map((file) => (
              <Stack
                key={file.data.name}
                align="center"
                justify="space-between"
                spacing="m"
                css={{ width: "100%", py: "$s" }}
              >
                <Stack align="center" spacing="s">
                  <FileAudio size={24} />
                  <Stack direction="column" spacing="xs">
                    <Text size="s" css={{ fontWeight: "$strong" }}>
                      {file.data.name}
                    </Text>
                    <Text size="s">{formatFileSize(file.data.size)}</Text>
                  </Stack>
                </Stack>
                <Button
                  variant="none"
                  onClick={handleRemoveFile(file.data.name)}
                  aria-label={`Eliminar ${file.data.name}`}
                >
                  <Trash size={18} />
                </Button>
              </Stack>
            ))}
          </Stack>
        </Card>
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
        <Button onClick={handleSelectFile} size="l" variant="secondary">
          Cargar más audios
        </Button>
        <Button
          onClick={handleConfirmFiles}
          disabled={files.length === 0}
          size="l"
        >
          Siguiente
        </Button>
      </Footer>
    </>
  );
}
