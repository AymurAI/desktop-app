import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useSummary } from "@/context/Summary";
import { downloadBlob } from "@/services/export/download-blob";
import {
  type SummaryExportFormat,
  exportSummary,
} from "@/services/export/export-summary";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import {
  Button,
  Card,
  RichTextEditor,
  Select,
  type SelectOption,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FORMAT_OPTIONS: SelectOption[] = [
  { id: "txt", text: ".txt" },
  { id: "odt", text: ".odt" },
  { id: "pdf", text: ".pdf" },
];

export default function SummaryFinish() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const summary = useSummary();
  const [format, setFormat] = useState<SummaryExportFormat>("txt");

  const handleBack = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  const handleExport = async () => {
    if (!summary.document) return;
    const blob = await exportSummary(summary.document, summary.title, format);
    downloadBlob(blob, `${summary.title}.${format}`);
  };

  if (!summary.document) return null;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={4} />
      <Stack gap="6" p="8">
        <styled.h1 textStyle="title.md.strong">
          {t("finish.sectionTitle")}
        </styled.h1>
        <styled.p textStyle="paragraph.md.default">
          {t("finish.description")}
        </styled.p>
        <Card>
          <Grid columns={2} gap="12">
            <Stack gap="4">
              <styled.h2 textStyle="subtitle.md.strong">
                {t("finish.previewLabel")}
              </styled.h2>
              <RichTextEditor document={summary.document} readOnly />
            </Stack>
            <Stack gap="6">
              <styled.h2 textStyle="subtitle.md.strong">
                {t("finish.exportOptionsLabel")}
              </styled.h2>
              <Select
                label={t("finish.formatLabel")}
                value={format}
                clearable={false}
                onChange={(opt) => setFormat(opt.id as SummaryExportFormat)}
                options={FORMAT_OPTIONS}
              />
            </Stack>
          </Grid>
        </Card>
      </Stack>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button variant="secondary" onClick={handleBack}>
            {t("finish.back")}
          </Button>
          <Button onClick={handleExport}>{t("finish.export")}</Button>
        </HStack>
      </Footer>
    </>
  );
}
