import { Checkbox, Text } from "components";
import { FileContainer, Wrapper } from "./FilePreview.styles";
import { DocFile } from "types/file";
import { useFileDispatch, useFileParser, useUser } from "hooks";
import { toggleSelected } from "reducers/file/actions";
import { FunctionType } from "types/user";

interface Props {
  file: DocFile;
}

export default function FilePreview({ file }: Props) {
  const user = useUser();

  const dispatch = useFileDispatch();
  // Converts the doc/docx file into HTML that can be inserted into a `<div>`
  const html = useFileParser(file.data);

  return (
    <Wrapper>
      {user?.function !== FunctionType.ANONYMIZER && (
        <Checkbox
          css={{ position: "absolute", top: "$s", right: "$s" }}
          checked={file.selected}
          onChange={() => dispatch(toggleSelected(file.data.name))}
        ></Checkbox>
      )}
      <FileContainer
        dangerouslySetInnerHTML={{ __html: html.document ?? "" }}
      />
      <Text size="s">{file.data.name}</Text>
    </Wrapper>
  );
}
