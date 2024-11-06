import { X } from "phosphor-react";
import { ChangeEventHandler, useContext, useRef } from "react";

import { HiddenInput, Stack, Button as BaseButton } from "components";
import Button from "./Button";
import ProgressBar from "./ProgressBar";
import { useFileDispatch } from "hooks";
import { replaceFile, removeFile } from "reducers/file/actions";
import { usePredict, PredictStatus } from "hooks/usePredict";
import { DocFile } from "types/file";
import { ServerUrlContext } from "context/ServerUrl";

interface Props {
  file: DocFile;
  onStatusChange?: (newStatus: PredictStatus) => void;
  onFileReplace?: (newName: string) => void;
}
export default function FileProcessing({
  file,
  onStatusChange,
  onFileReplace,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { serverUrl } = useContext(ServerUrlContext);
  const { progress, status, abort } = usePredict(
    file,
    { onStatusChange },
    serverUrl
  );
  const dispatch = useFileDispatch();

  const handleOpenFinder = () => {
    inputRef.current?.click();
  };

  const handleAddedFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    // Check if any file was added
    if (rawFiles) {
      const files = Array.from(rawFiles);

      // Only one file can be used to replace the old one
      if (files.length > 0) {
        onFileReplace?.(files[0].name);
        dispatch(replaceFile(file.data.name, files[0]));
      }
    }
  };

  const handleStop = () => {
    abort();
  };

  const remove = () => {
    abort();
    dispatch(removeFile(file.data.name));
  };

  return (
    <Stack align="center" spacing="m" css={{ width: "100%" }}>
      <HiddenInput
        multiple={false}
        css={{ position: "absolute" }}
        ref={inputRef}
        onChange={handleAddedFile}
      />
      <ProgressBar
        status={status}
        fileName={file.data.name}
        progress={status === "stopped" ? 0 : Math.round(progress * 100)}
      />
      <Button
        status={status}
        onStop={handleStop}
        onReplace={handleOpenFinder}
      />
      <BaseButton variant="none" onClick={remove}>
        <X />
      </BaseButton>
    </Stack>
  );
}
