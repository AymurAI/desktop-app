import { useState, useContext } from 'react';

import { useFileParser, useUser } from 'hooks';
import { DocFile } from 'types/file';
import { markWords } from 'utils/html';

import * as S from './FileContainer.styles';
import { SearchBar } from 'components';
import { FunctionType } from 'types/user';
import { SelectOption } from 'components/select';
import { AnonymizerContext } from 'context/Anonymizer';
import { reverse as reverseHash } from 'utils/html/hashWord';

interface Props {
  file: DocFile;
}

export default function FileContainer({ file }: Props) {
  const user = useUser();
  const fileHTML = useFileParser(file.data, (html) => html);

  const [predictions, setPredictions] = useState<string[]>(
    file.predictions!.map((label) =>
      label.aymurai_alt_text ? label.aymurai_alt_text : label.text
    )
  );
  const [predictionsTags, setPredictionsTags] = useState<any[]>(
    file.predictions!.map((label) => ({
      text: label.aymurai_alt_text ? label.aymurai_alt_text : label.text,
      tag: label.attrs.aymurai_label,
    }))
  );

  const [selectedTag, setSelectedTag] = useState<SelectOption>();
  const predictedHtml = markWords.predicted(fileHTML.document, predictions);
  const anonymizedHtml = markWords.anonymizer(
    fileHTML.document,
    predictions,
    predictionsTags,
    false,
    fileHTML.header
  );
  const { setAnonymizedText } = useContext(AnonymizerContext);
  //here we store the html that is going to be converted to docx
  setAnonymizedText(
    markWords.anonymizer(
      fileHTML.document,
      predictions,
      predictionsTags,
      true,
      fileHTML.header
    )
  );

  const [searchText, setSearchText] = useState('');
  const isSearchEnabled = searchText.length > 2;

  const searchedHtml = isSearchEnabled
    ? markWords.searched(
        user?.function === FunctionType.ANONYMIZER
          ? anonymizedHtml
          : predictedHtml,
        searchText
      )
    : user?.function === FunctionType.ANONYMIZER
    ? anonymizedHtml
    : predictedHtml;

  const handleChange = (text: string, selected?: boolean) => {
    setSearchText(text);

    if (selected && selectedTag) {
      setPredictions([...predictions, text!]);
      setPredictionsTags([
        ...predictionsTags,
        { text: text!, tag: selectedTag?.id },
      ]);
    }
  };

  const clickHandler = (e: any) => {
    const el = e.target.closest('button.remove-tag');
    const id = reverseHash(e.target.id);

    if (el && e.currentTarget.contains(el)) {
      const filteredPredictions = predictions.filter((value) => value !== id);
      setPredictions(filteredPredictions);

      const filteredPredictionsTags = predictionsTags.filter(
        (value) => value?.text !== id
      );
      setPredictionsTags(filteredPredictionsTags);
    }

    if (document.getSelection()?.toString() && selectedTag) {
      const highlightedText = document.getSelection()?.toString();
      setPredictions([...predictions, highlightedText!]);
      setPredictionsTags([
        ...predictionsTags,
        { text: highlightedText!, tag: selectedTag.id },
      ]);
    }
  };

  const handleSelectChange = (value: SelectOption | undefined) => {
    setSelectedTag(value);
  };

  return (
    <S.Container>
      <S.SearchBarWrapper>
        <S.SearchBarPadding>
          <SearchBar
            html={searchedHtml}
            word={searchText}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
          />
        </S.SearchBarPadding>
      </S.SearchBarWrapper>
      <S.File
        onClick={clickHandler}
        dangerouslySetInnerHTML={{
          __html: searchedHtml,
        }}
      ></S.File>
    </S.Container>
  );
}
