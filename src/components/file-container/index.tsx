import { useState, useContext, MouseEventHandler } from 'react';

import { useFileParser, useUser } from 'hooks';
import { DocFile } from 'types/file';
import { markWords } from 'utils/html';

import * as S from './FileContainer.styles';
import { SearchBar } from 'components';
import { FunctionType } from 'types/user';
import { SelectOption } from 'components/select';
import { AnonymizerContext } from 'context/Anonymizer';
import { reverse as reverseHash } from 'utils/html/hashWord';
import { groupParagraphs } from 'services/aymurai/groupPredictions';
import { useTagging } from './useTagging';
import { countSiblingOffset } from 'utils/html/replaceWords';
import { selectionHasNode } from './utils';

interface Props {
  file: DocFile;
}

export default function FileContainer({ file }: Props) {
  const user = useUser();
  const fileHTML = useFileParser(file.data, (html) => {
    return html;
  });
  const { tags, addTag, removeTag } = useTagging(file);
  const initialParagraphs = groupParagraphs(fileHTML.document);

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

  const [searchedTag, setSearchedTag] = useState<SelectOption>();
  const predictedHtml = markWords.predicted(fileHTML.document, predictions);
  const anonymizedHtml = markWords.anonymizer(
    fileHTML.document,
    tags,
    false,
    fileHTML.header
  );
  const { setAnonymizedText } = useContext(AnonymizerContext);

  // Generates and stores the HTML ready to be outputed as a docx file
  setAnonymizedText(
    markWords.anonymizer(fileHTML.document, tags, true, fileHTML.header)
  );

  const [searchText, setSearchText] = useState('');
  const isSearchEnabled = searchText.length > 1;

  const searchedHtml = isSearchEnabled
    ? markWords.searched(
        user?.function === FunctionType.ANONYMIZER
          ? anonymizedHtml
          : predictedHtml,
        searchText,
        searchedTag?.id
      )
    : user?.function === FunctionType.ANONYMIZER
    ? anonymizedHtml
    : predictedHtml;

  const handleChange = (text: string, selected?: boolean) => {
    setSearchText(text);

    if (selected && searchedTag) {
      setPredictions([...predictions, text!]);
      setPredictionsTags([
        ...predictionsTags,
        { text: text!, tag: searchedTag?.id },
      ]);
    }
  };

  const handleSelectChange = (value: SelectOption | undefined) => {
    setSearchedTag(value);
  };

  const handleFileClick: MouseEventHandler = (e) => {
    const element = e.target as HTMLElement;
    const selection = window.getSelection();
    const selectedText = selection!.toString();

    // Get parent or itself if the target is a paragraph
    const paragraph = element.tagName === 'P' ? element : element.closest('p');

    if (!paragraph) return;

    // Add the selection to the tag list
    if (
      selectedText &&
      searchedTag &&
      !element.closest('mark') &&
      !selectionHasNode(selection)
    ) {
      // Get the index of the selected text inside the whole paragraph
      const index = countSiblingOffset(
        selection!.anchorNode as Text,
        Math.min(selection!.anchorOffset, selection!.focusOffset)
      );

      addTag({
        paragraph: initialParagraphs.get(paragraph.id),
        text: selectedText,
        tag: searchedTag.id,
        index,
      });
    } else {
      // Check the action performed over a tagged word (+ or x button)
      const close = (e.target as HTMLElement).closest('button');
      if (!close) return;

      // The word and the tag is stored in the button itself
      // FIXME: remove ignores
      // @ts-ignore
      const word = reverseHash(close.attributes['data-text']!.value);
      // @ts-ignore
      const tag = reverseHash(close.attributes['data-tag']!.value);
      // @ts-ignore
      const index = Number(close.attributes['data-i']!.value);
      const paragraphId = paragraph?.id;

      if (close.className === 'add-tag') {
        addTag({
          text: word,
          tag,
          paragraph: initialParagraphs.get(paragraph.id),
          index,
        });

        // setSearchText('');
      } else {
        removeTag({ text: word, tag, paragraphId, index });
      }
    }
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
        onClick={handleFileClick}
        dangerouslySetInnerHTML={{
          __html: searchedHtml,
        }}
      ></S.File>
    </S.Container>
  );
}
