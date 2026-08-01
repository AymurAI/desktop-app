import { useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import AppToaster from "@/components/layout/app-toaster";
import VoiceFinish from "@/components/voice-to-text/finish";
import { FileContext } from "@/context/File";
import { TranscriptionContext } from "@/context/Transcription";
import { showToast } from "@/features/showToast";
import { buildFixture } from "@/services/aymurai/fixtures/transcription";
import { buildDocFileFixture } from "./document-file";

interface ToastFooterFixtureProps {
  toastCount?: number;
}

function ToastEmitter({ toastCount = 1 }: ToastFooterFixtureProps) {
  const { t } = useTranslation("voice-to-text");
  const didShowToast = useRef(false);

  useEffect(() => {
    if (didShowToast.current) {
      return;
    }

    didShowToast.current = true;

    for (let index = 0; index < toastCount; index += 1) {
      showToast(t("validation.saveFailed"), "warning");
    }

    return () => {
      toast.remove();
    };
  }, [t, toastCount]);

  return null;
}

/**
 * Mounted only by the Playwright CT screen specs. It uses the real
 * `/app/VOICE_TO_TEXT/finish` component, real `Footer`, real `showToast`, and
 * the same `AppToaster` as App's global shell.
 */
export function ToastFooterFixture({
  toastCount = 1,
}: ToastFooterFixtureProps = {}) {
  const files = useMemo(() => [buildDocFileFixture()], []);
  const transcriptions = useMemo(
    () => [buildFixture(new File([new Uint8Array(1)], "audiencia.webm"))],
    [],
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <FileContext.Provider value={files}>
        <TranscriptionContext.Provider value={transcriptions}>
          <VoiceFinish />
          <ToastEmitter toastCount={toastCount} />
          <AppToaster />
        </TranscriptionContext.Provider>
      </FileContext.Provider>
    </div>
  );
}
