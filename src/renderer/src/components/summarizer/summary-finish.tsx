import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import { DOCUMENT_EXTENSIONS } from "@/constants/config";
import { useSummary } from "@/context/Summary";
import { SectionTitle } from "@/layout/section-title";
import { downloadBlob } from "@/services/export/download-blob";
import {
  type SummaryExportFormat,
  exportSummary,
} from "@/services/export/export-summary";
import { css } from "@/styled/css";
import { Divider, Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { sanitizeFileName } from "@/utils/sanitize-file-name";
import {
  Button,
  Callout,
  Card,
  RichTextEditor,
  Select,
  type SelectOption,
  TooltipProvider,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Alphabetical by extension, matching the VTT finish screen's format list.
const FORMAT_IDS: SummaryExportFormat[] = ["odt", "pdf", "txt"];

const DEFAULT_FILE_NAME = "resumen";

// Matches ArchiveView's "preview" frame (border/4px/#BCBAB8, rounded, subtle
// shadow) so this reads as the same document-page chrome as the rest of the
// app, while actually rendering the summary's real formatting (headings,
// bold, lists…) instead of a flattened image.
const previewFrame = css({
  w: "full",
  h: "[357px]",
  rounded: "md",
  borderWidth: "[4px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  boxShadow: "[0px_0px_4px_rgba(0,0,0,0.1)]",
  bg: "bg.secondary",
  overflow: "hidden",
});

export default function SummaryFinish() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const summary = useSummary();
  const [format, setFormat] = useState<SummaryExportFormat>("odt");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const formatOptions: SelectOption[] = FORMAT_IDS.map((id) => ({
    id,
    text: `.${id}`,
    description: t(`finish.formatDescriptions.${id}`),
  }));

  const handleBack = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  const handleExport = async () => {
    if (!summary.document) return;
    setIsExporting(true);
    setExportError(false);
    try {
      const blob = await exportSummary(summary.document, summary.title, format);
      const baseName = sanitizeFileName(
        summary.title,
        DOCUMENT_EXTENSIONS,
        DEFAULT_FILE_NAME,
      );
      downloadBlob(blob, `${baseName}.${format}`);
    } catch {
      setExportError(true);
    } finally {
      setIsExporting(false);
    }
  };

  if (!summary.document) return null;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={4} />
      <MainContent>
        <Stack gap="6">
          <Stack gap="1">
            <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
            <styled.p textStyle="paragraph.md.default">
              {t("finish.description")}
            </styled.p>
          </Stack>
          <Card>
            <Grid gridTemplateColumns="1fr auto 1fr" columnGap="12" rowGap="6">
              <Stack gap="4">
                <styled.h2 textStyle="subtitle.md.strong">
                  {t("finish.previewLabel")}
                </styled.h2>
                <div className={previewFrame}>
                  <RichTextEditor
                    document={summary.document}
                    readOnly
                    variant="embedded"
                    aria-label={t("finish.previewLabel")}
                  />
                </div>
              </Stack>

              <Divider
                orientation="vertical"
                color="[#BCBAB8]"
                alignSelf="stretch"
              />

              <Stack gap="6">
                <styled.h2 textStyle="subtitle.md.strong">
                  {t("finish.exportOptionsLabel")}
                </styled.h2>
                <TooltipProvider>
                  <Select
                    label={t("finish.formatLabel")}
                    value={format}
                    clearable={false}
                    onChange={(opt) => setFormat(opt.id as SummaryExportFormat)}
                    options={formatOptions}
                  />
                </TooltipProvider>
                {exportError && (
                  <Callout
                    message={t("finish.exportError")}
                    variant="error"
                    size="compact"
                    noBorder
                  />
                )}
              </Stack>
            </Grid>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button variant="secondary" onClick={handleBack}>
            {t("finish.back")}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            isLoading={isExporting}
          >
            {t("finish.export")}
          </Button>
        </HStack>
      </Footer>
    </>
  );
}
