import { Checkbox, Spinner, Text } from "components";
import { ServerUrlContext } from "context/ServerUrl";
import { useFileDispatch, useFileParser, useUser } from "hooks";
import { FileX } from "phosphor-react";
import { useContext } from "react";
import { toggleSelected } from "reducers/file/actions";

import { DocFile } from "types/file";
import { FunctionType } from "types/user";

import * as S from "./FilePreview.styles";

interface Props {
  file: DocFile;
}
export default function FilePreview({ file }: Props) {
  const user = useUser();
  const dispatch = useFileDispatch();
  const { serverUrl } = useContext(ServerUrlContext);
  const paragraphs = useFileParser(file, serverUrl);

  const isAnonymizer = user?.function === FunctionType.ANONYMIZER;
  const isError = paragraphs && !paragraphs.length;

  return (
    <S.Wrapper>
      {!isAnonymizer && !!paragraphs?.length && (
        <Checkbox
          css={{ position: "absolute", top: "$s", right: "$s" }}
          checked={file.selected}
          onChange={() => dispatch(toggleSelected(file.data.name))}
        ></Checkbox>
      )}

      {isError && (
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
      )}

      <S.FileContainer error={isError} isLoading={!paragraphs}>
        {paragraphs ? (
          paragraphs.map(({ value, id }) => (
            <S.Paragraph {...{ id, key: id }}>{value}</S.Paragraph>
          ))
        ) : (
          <Spinner></Spinner>
        )}
      </S.FileContainer>
      {!isError ? (
        <Text title={file.data.name} size="s">
          {file.data.name}
        </Text>
      ) : (
        <Text
          css={{ color: "$colors$errorPrimary" }}
          title={file.data.name}
          size="xs"
        >
          No se pudo cargar el archivo
        </Text>
      )}
    </S.Wrapper>
  );
}
