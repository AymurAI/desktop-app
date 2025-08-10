import { FileX } from "phosphor-react";

import { Checkbox, Spinner, Text } from "@/components";
import { useFileDispatch, useUser } from "@/hooks";
import { toggleSelected } from "@/reducers/file/actions";
import { useFileParser } from "@/services/aymurai/useFileParser";
import type { DocFile } from "@/types/file";
import { FunctionType } from "@/types/user";

import * as S from "./FilePreview.styles";

interface Props {
  file: DocFile;
}
export default function FilePreview({ file }: Props) {
  const user = useUser();
  const dispatch = useFileDispatch();
  const { data: parsedFile, isError, isPending } = useFileParser(file.data);

  const isAnonymizer = user?.function === FunctionType.ANONYMIZER;
  const moreThanOneParagraph = parsedFile && parsedFile.document.length > 1;

  if (isError) {
    return (
      <S.Wrapper>
        <FileX
          size={48}
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#DC582E",
          }}
        />

        <S.FileContainer error={true} isLoading={false} />

        <Text
          css={{ color: "$colors$errorPrimary", textAlign: "center" }}
          title={file.data.name}
          size="xs"
        >
          No se pudo cargar el archivo
        </Text>
      </S.Wrapper>
    );
  }

  if (isPending || !parsedFile) {
    return (
      <S.Wrapper>
        <S.FileContainer error={false} isLoading={true}>
          <Spinner />
        </S.FileContainer>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper>
      {!isAnonymizer && moreThanOneParagraph && (
        <Checkbox
          css={{ position: "absolute", top: "$s", right: "$s" }}
          checked={file.selected}
          onChange={() => dispatch(toggleSelected(file.data.name))}
        />
      )}

      <S.FileContainer error={isError} isLoading={isPending}>
        {parsedFile.document.map((p) => (
          <S.Paragraph key={p} id={p}>
            {p}
          </S.Paragraph>
        ))}
      </S.FileContainer>

      <Text title={file.data.name} size="s">
        {file.data.name}
      </Text>
    </S.Wrapper>
  );
}
