import { useFiles } from "@/hooks";
import { css } from "@/styled/css";
import { HStack } from "@/styled/jsx";
import type { DocFile } from "@/types/file";
import { ArchiveTabs, Button } from "@aymurai/ui";
import { CaretLeft, CaretRight } from "phosphor-react";
import { canMoveLeft as checkLeft, canMoveRight as checkRight } from "./utils";

const carousel = css({
  display: "flex",
  flexDirection: "row",
  gap: "2",
  alignItems: "center",
  flex: "1",
  overflowX: "auto",
});

interface Props {
  selected: number;
  nextFile: () => void;
  previousFile: () => void;
}
export default function FileStepper({
  selected,
  nextFile,
  previousFile,
}: Props) {
  const files = useFiles();

  const canMoveLeft = checkLeft(selected, files);
  const canMoveRight = checkRight(selected, files);
  const isLeftDisabled = selected === 0;
  const isRightDisabled = selected === files.length - 1; // -1 because we are using base 0 notation

  const getStatus = (current: number, file: DocFile) => {
    if (file.validated) {
      return "completed" as const;
    }
    return selected === current
      ? ("selected" as const)
      : ("unselected" as const);
  };

  return (
    <HStack overflow="hidden" gap="2" width="full">
      {canMoveLeft && (
        <Button
          variant="tertiary"
          size="icon-sm"
          disabled={isLeftDisabled}
          onClick={previousFile}
          aria-label="Documento anterior"
        >
          <CaretLeft size={24} />
        </Button>
      )}

      <div className={carousel} role="tablist" aria-label="Documentos">
        {files.map((file, i) => (
          <ArchiveTabs
            key={file.data.name}
            label={file.data.name}
            status={getStatus(i, file)}
          />
        ))}
      </div>

      {canMoveRight && (
        <Button
          variant="tertiary"
          size="icon-sm"
          disabled={isRightDisabled}
          onClick={nextFile}
          aria-label="Documento siguiente"
        >
          <CaretRight size={24} />
        </Button>
      )}
    </HStack>
  );
}
