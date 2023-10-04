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
  const predictions = file.predictions!.map((label) => label.text);
  const predictionsTags = file.predictions!.map((label) => ({
    text: label.text,
    tag: label.attrs.aymurai_label,
  }));
  const [searchText, setSearchText] = useState("");

  const isSearchEnabled = searchText.length > 2;

  const predictedHtml = useFileParser(file.data, (html) =>
    markWords.anonymizer(html, predictions, predictionsTags)
  );
  const searchedHtml = isSearchEnabled
    ? markWords.searched(predictedHtml, searchText)
    : predictedHtml;

  const handleChange = (text: string) => {
    setSearchText(text);
  };

  const clickHandler = (e: any) => {
    console.log(file);
    const el = e.target.closest("mark");
    if (el && e.currentTarget.contains(el)) {
      console.log(e.target.outerText);
      console.log(e.target.outerHTML);
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
        dangerouslySetInnerHTML={{ __html: predictedHtml }}
      ></S.File>
    </S.Container>
  );
}
