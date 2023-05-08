import { useState } from 'react';

import { useFileParser } from 'hooks';
import { DocFile } from 'types/file';
import { markWords } from 'utils/html';

import * as S from './FileContainer.styles';
import { SearchBar } from 'components';

interface Props {
  file: DocFile;
}

export default function FileContainer({ file }: Props) {
  const predictions = file.predictions!.map((label) => label.text);
  const [searchText, setSearchText] = useState('');

  const markedHtml = useFileParser(file.data, (html) =>
    markWords.predicted(html, predictions)
  );
  const searchedHtml = markWords.searched(markedHtml, searchText);

  const handleChange = (text: string) => {
    setSearchText(text);
  };

  return (
    <S.Container>
      <S.SearchBarWrapper>
        <S.SearchBarPadding>
          <SearchBar
            html={searchedHtml}
            word={searchText}
            onChange={handleChange}
          />
        </S.SearchBarPadding>
      </S.SearchBarWrapper>
      <S.File dangerouslySetInnerHTML={{ __html: searchedHtml }}></S.File>
    </S.Container>
  );
}
