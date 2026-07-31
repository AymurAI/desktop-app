import { useTranslation } from "react-i18next";
import Text from "../text";
import ErrorText from "./ErrorText";
import { Card, Wrapper, fileNameEllipsis } from "./FileCheck.styles";
import Icon from "./Icon";

interface Props {
  fileName: string;
  hasError?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
}
export default function FileCheck({
  fileName,
  hasError = false,
  isLoading = false,
  errorMessage,
}: Props) {
  const { t } = useTranslation("common");
  // `errorMessage` is a caller-supplied override (both call sites that
  // matter pass one); an empty string falls back to the default too, so
  // `hasError` never renders an empty, borderless-looking error line.
  const message = errorMessage || t("fileCheck.defaultError");

  return (
    <Wrapper>
      <Card {...{ hasError }}>
        <Icon {...{ hasError, isLoading }} />
      </Card>
      <Text size="s" className={fileNameEllipsis} title={fileName}>
        {fileName}
      </Text>
      {hasError && <ErrorText>{message}</ErrorText>}
    </Wrapper>
  );
}
