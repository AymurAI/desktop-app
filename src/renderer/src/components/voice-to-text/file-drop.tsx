import { FileAudio } from "phosphor-react";
import { type DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AUDIO_EXTENSIONS } from "@/constants/config";
import { css, cva } from "@/styled/css";
import { Stack, styled } from "@/styled/jsx";

const zone = cva({
  base: {
    display: "flex",
    flexDir: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4",
    width: "full",
    minHeight: "[320px]",
    rounded: "lg",
    borderWidth: "[1px]",
    borderStyle: "solid",
    cursor: "pointer",
    transition: "[background-color 150ms ease, border-color 150ms ease]",
  },
  variants: {
    dragging: {
      true: { bg: "bg.primary-highlight", borderColor: "brand.primary" },
      false: { bg: "bg.primary-alternative", borderColor: "[#BCBAB8]" },
    },
  },
  defaultVariants: { dragging: false },
});

const iconBox = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16",
  height: "16",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "brand.primary",
});

interface VoiceFileDropProps {
  onDropFiles: (files: File[]) => void;
  onClickZone: () => void;
}

function hasAudioExtension(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.includes(ext);
}

export default function VoiceFileDrop({
  onDropFiles,
  onClickZone,
}: VoiceFileDropProps) {
  const { t } = useTranslation("voice-to-text");
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(hasAudioExtension);
    if (files.length) onDropFiles(files);
  };

  return (
    <button
      type="button"
      className={zone({ dragging })}
      onClick={onClickZone}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <div className={iconBox}>
        <FileAudio size={32} weight="regular" />
      </div>
      <Stack gap="1" align="center">
        <styled.p
          textStyle="subtitle.md.default"
          color="text.default"
          textAlign="center"
        >
          {t("onboarding.dropAreaTitle")}
        </styled.p>
        <styled.p textStyle="paragraph.sm.default" color="text.lighter">
          {t("onboarding.dropAreaFormats")}
        </styled.p>
      </Stack>
    </button>
  );
}
