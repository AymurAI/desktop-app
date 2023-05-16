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

  const isSearchEnabled = searchText.length > 2;

  const html = useFileParser(file.data);

  const alterHtml = isSearchEnabled
    ? markWords.searched(html, searchText)
    : markWords.predicted(html, predictions);

  const handleChange = (text: string) => {
    setSearchText(text);
  };

  return (
    <S.Container>
      <S.SearchBarWrapper>
        <S.SearchBarPadding>
          <SearchBar
            html={alterHtml}
            word={searchText}
            onChange={handleChange}
          />
        </S.SearchBarPadding>
      </S.SearchBarWrapper>
      <S.File dangerouslySetInnerHTML={{ __html: alterHtml }}></S.File>
    </S.Container>
  );
}
