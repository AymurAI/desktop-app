import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import DocumentSearchPanel from "@/components/summarizer/document-search-panel";
import BackButton from "@/components/ui/back-button";
import {
  edit,
  editTitle,
  useSummary,
  useSummaryDispatch,
} from "@/context/Summary";
import { useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { summaryValidationClient } from "@/services/aymurai/summaryValidationClient";
import { Grid, HStack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import {
  Button,
  Callout,
  RichTextEditor,
  serializeToPlainText,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SummaryValidation() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const files = useFiles();
  const file = files[0];
  const summary = useSummary();
  const dispatch = useSummaryDispatch();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleSave = () => {
    if (!file || !summary.document) return;
    setSaving(true);
    setSaveFailed(false);
    summaryValidationClient
      .save({
        documentId: file.data.name,
        title: summary.title,
        generatedSummary: summary.partialText,
        editedSummary: serializeToPlainText(summary.document),
      })
      .catch(() => setSaveFailed(true))
      .finally(() => setSaving(false));
  };

  const handleBack = () => {
    handleSave();
    navigate({
      to: "/app/$feature/process",
      params: { feature: FeatureFlowEnum.Summarizer },
    });
  };

  const handleContinue = () => {
    handleSave();
    navigate({
      to: "/app/$feature/finish",
      params: { feature: FeatureFlowEnum.Summarizer },
    });
  };

  if (!summary.document || !file) return null;

  const hasSummary = summary.document.paragraphs.length > 0;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={3} />
      <HStack alignItems="center" gap="6" px="6" py="4">
        <BackButton
          to="/app/$feature/process"
          params={{ feature: FeatureFlowEnum.Summarizer }}
        />
        <SectionTitle>{t("validation.sectionTitle")}</SectionTitle>
      </HStack>
      <Grid
        columns={2}
        gap="0"
        flex="1"
        minHeight="0"
        overflow="hidden"
        justifyContent="stretch"
        alignItems="stretch"
      >
        <DocumentSearchPanel paragraphs={file.paragraphs ?? []} />
        <div onBlur={handleSave}>
          {hasSummary ? (
            <RichTextEditor
              document={summary.document}
              onChange={(next) => dispatch(edit(next))}
              title={summary.title}
              onTitleChange={(next) => dispatch(editTitle(next))}
              aria-label={t("validation.originalDocumentLabel")}
            />
          ) : (
            <Callout message={t("validation.missingSummary")} variant="error" />
          )}
        </div>
      </Grid>
      {saving && (
        <Callout
          message={t("validation.saving")}
          variant="info"
          size="compact"
          noBorder
        />
      )}
      {saveFailed && (
        <Callout
          message={t("validation.saveFailed")}
          variant="warning"
          size="compact"
          noBorder
        />
      )}
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button variant="secondary" onClick={handleBack}>
            {t("validation.back")}
          </Button>
          <Button onClick={handleContinue}>{t("validation.finish")}</Button>
        </HStack>
      </Footer>
    </>
  );
}
