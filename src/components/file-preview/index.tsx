import { useFileDispatch, useUser, useFileParser } from 'hooks';
import { Checkbox, Spinner, Text } from 'components';
import { toggleSelected } from 'reducers/file/actions';

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

      <S.FileContainer isLoading={!paragraphs}>
        {paragraphs ? (
          paragraphs.map(({ value, id }) => (
            <S.Paragraph {...{ id, key: id }}>{value}</S.Paragraph>
          ))
        ) : (
          <Spinner></Spinner>
        )}
      </S.FileContainer>

      <Text title={file.data.name} size="s">
        {file.data.name}
      </Text>
    </S.Wrapper>
  );
}
