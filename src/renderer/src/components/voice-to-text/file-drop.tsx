import { FileAudio } from "phosphor-react";
import { type DragEvent, useState } from "react";
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
}

function hasAudioExtension(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.includes(ext);
}

export default function VoiceFileDrop({ onDropFiles }: VoiceFileDropProps) {
  const { t } = useTranslation("voice-to-text");
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(hasAudioExtension);
    if (files.length) onDropFiles(files);
  };

  return (
    <button
      type="button"
      className={zone({ dragging })}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
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
