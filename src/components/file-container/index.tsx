import { useState } from "react";

import { useFileParser } from "hooks";
import { DocFile } from "types/file";
import { markWords } from "utils/html";

import * as S from "./FileContainer.styles";
import { SearchBar } from "components";

interface Props {
  file: DocFile;
}

export default function FileContainer({ file }: Props) {
  const fileHTML = useFileParser(file.data, (html) => html);
  const predictions = file.predictions!.map((label) => label.text);
  const predictionsTags = file.predictions!.map((label) => ({
    text: label.text,
    tag: label.attrs.aymurai_label,
  }));
  const [removedText, setRemovedText] = useState<string[]>([]);
  const predictedHtml = markWords.predicted(fileHTML, predictions);
  const anonymizedHtml = markWords.anonymizer(
    fileHTML,
    predictions,
    predictionsTags,
    removedText
  );

  const [searchText, setSearchText] = useState("");
  const isSearchEnabled = searchText.length > 2;

  const searchedHtml = isSearchEnabled
    ? markWords.searched(predictedHtml, searchText)
    : predictedHtml;

  const handleChange = (text: string) => {
    setSearchText(text);
  };

  const clickHandler = (e: any) => {
    const el = e.target.closest("close");
    if (el && e.currentTarget.contains(el)) {
      if (!removedText.includes(e.target.id))
        setRemovedText([...removedText, e.target.id]);
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
          />
        </S.SearchBarPadding>
      </S.SearchBarWrapper>
      <S.File
        onClick={clickHandler}
        dangerouslySetInnerHTML={{ __html: anonymizedHtml }}
      ></S.File>
    </S.Container>
  );
}
