import { useState } from "react";

import { useFileParser } from "hooks";
import { DocFile } from "types/file";
import { markWords } from "utils/html";

import * as S from "./FileContainer.styles";
import { SearchBar } from "components";
import { useContext } from "react";
import { AuthenticationContext as Context } from "context/Authentication";
import { FunctionType } from "types/user";
import { SelectOption } from "components/select";
import { AnonymizerContext } from "context/Anonymizer";
import { anonymizerLabels } from "types/aymurai";

interface Props {
  file: DocFile;
}

export default function FileContainer({ file }: Props) {
  const { user } = useContext(Context);

  const fileHTML = useFileParser(file.data, (html) => html);

  const [predictions, setPredictions] = useState<string[]>(
    file.predictions!.map((label) => label.text)
  );
  const [predictionsTags, setPredictionsTags] = useState<any[]>(
    file.predictions!.map((label) => ({
      text: label.text,
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
    markWords.anonymizer(fileHTML.document, predictions, anonymizerLabels, true)
  );

  const [searchText, setSearchText] = useState("");
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
    const el = e.target.closest("close");
    if (el && e.currentTarget.contains(el)) {
      const filteredPredictions = predictions.filter(
        (value) => value !== e.target.id
      );
      setPredictions(filteredPredictions);

      const filteredPredictionsTags = predictionsTags.filter(
        (value) => value?.text !== e.target.id
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
          __html:
            user?.function === FunctionType.ANONYMIZER
              ? anonymizedHtml
              : predictedHtml,
        }}
      ></S.File>
    </S.Container>
  );
}
