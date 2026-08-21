import { useTranslation } from "react-i18next";
import Text from "../text";
import ErrorText from "./ErrorText";
import { Card, Wrapper } from "./FileCheck.styles";
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
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Card {...{ hasError }}>
        <Icon {...{ hasError, isLoading }} />
      </Card>
      <Text size="s">{fileName}</Text>
      {hasError && (
        <ErrorText>{errorMessage ?? t("fileCheck.defaultError")}</ErrorText>
      )}
    </Wrapper>
  );
}
