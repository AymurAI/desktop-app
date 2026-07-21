import { useState } from "react";
import { useTranslation } from "react-i18next";

import { showToast } from "@/features/showToast";
import type { Transcription } from "@/types/transcription";
import { downloadBlob } from "./download-blob";
import { exportTranscription } from "./export-transcription";
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type ExportOptions,
} from "./types";

/**
 * Drives the download flow for a transcription: builds the export content
 * (client-side for txt/odt, via the backend's odt->pdf converter for pdf)
 * and triggers the browser download. Kept separate from
 * `exportTranscription`/`buildExportDocument` so a future preview screen can
 * reuse those directly without the download side effect.
 */
export function useExportTranscription(transcription: Transcription | null) {
  const { t } = useTranslation("voice-to-text");
  const [isExporting, setIsExporting] = useState(false);

  const download = async (
    format: ExportFormat,
    options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  ) => {
    if (!transcription) return;
    setIsExporting(true);
    try {
      const { blob, fileName } = await exportTranscription(
        transcription,
        format,
        options,
      );
      downloadBlob(blob, fileName);
    } catch {
      showToast(t("finish.exportFailed"), "warning");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, download };
}
