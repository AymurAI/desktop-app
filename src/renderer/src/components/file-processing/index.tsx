import { type ChangeEventHandler, useRef } from "react";

import HiddenInput from "@/components/hidden-input";
import { useFileDispatch } from "@/hooks";
import type { PredictStatus } from "@/hooks/usePredict";
import { replaceFile } from "@/reducers/file/actions";
import { ArchiveProgress, type ArchiveProgressStatus } from "@aymurai/ui";
import { useQueryClient } from "@tanstack/react-query";

const archiveStatus: Record<PredictStatus, ArchiveProgressStatus> = {
  processing: "default",
  stopped: "stopped",
  error: "error",
  completed: "completed",
};

interface Props {
  fileName: string;
  status: PredictStatus;
  progress: number;
  onAbort?: () => void;
}
export default function FileProcessing({
  fileName,
  status,
  progress,
  onAbort,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const queryClient = useQueryClient();

  const handleOpenFinder = () => {
    inputRef.current?.click();
  };

  const handleAddedFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    if (rawFiles) {
      const fileList = Array.from(rawFiles);
      if (fileList.length > 0) {
        queryClient.removeQueries({
          queryKey: ["file-parser", fileName],
          exact: false,
        });
        queryClient.removeQueries({
          queryKey: ["disambiguate", fileName],
          exact: false,
        });
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey as unknown[];
            return key[0] === "predict" && key[2] === fileName;
          },
        });
        dispatch(replaceFile(fileName, fileList[0]));
      }
    }
  };

  const handleStop = () => {
    onAbort?.();
  };

  return (
    <>
      <HiddenInput
        multiple={false}
        style={{ position: "absolute" }}
        ref={inputRef}
        onChange={handleAddedFile}
      />
      <ArchiveProgress
        fileName={fileName}
        status={archiveStatus[status]}
        progress={Math.round(progress * 100)}
        onStop={handleStop}
        onReplace={handleOpenFinder}
      />
    </>
  );
}
