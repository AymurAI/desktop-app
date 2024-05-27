import { useFileDispatch, useUser, useFileParser } from 'hooks';
import { Checkbox, Text } from 'components';
import { toggleSelected } from 'reducers/file/actions';
import { getParagraphId } from 'utils/file/getParagraphId';

import { FunctionType } from 'types/user';
import { DocFile } from 'types/file';

import * as S from './FilePreview.styles';

interface Props {
  file: DocFile;
}
export default function FilePreview({ file }: Props) {
  const user = useUser();
  const dispatch = useFileDispatch();
  const paragraphs = useFileParser(file);

  const isAnonymizer = user?.function === FunctionType.ANONYMIZER;

  return (
    <S.Wrapper>
      {!isAnonymizer && (
        <Checkbox
          css={{ position: 'absolute', top: '$s', right: '$s' }}
          checked={file.selected}
          onChange={() => dispatch(toggleSelected(file.data.name))}
        ></Checkbox>
      )}

      <S.FileContainer>
        {paragraphs ? (
          paragraphs.map((text) => {
            const id = getParagraphId(text);
            return <S.Paragraph {...{ id, key: id }}>{text}</S.Paragraph>;
          })
        ) : (
          /* TODO: implement laoding spinner */
          <Text>Loading...</Text>
        )}
      </S.FileContainer>

      <Text title={file.data.name} size="s">
        {file.data.name}
      </Text>
    </S.Wrapper>
  );
}
