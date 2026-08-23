import MainContent from "@/components/layout/main-content";
import { showToast } from "@/features/showToast";
import { useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { aymuraiService } from "@/services/aymurai";
import { downloadBlob } from "@/services/export/download-blob";
import { useExcludedTagsConfig } from "@/store/useLocal";
import { Divider, Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { getAnonymizerInputFormat } from "@/utils/anonymizer/input-format";
import {
  Button,
  Callout,
  Card,
  Select,
  type SelectOption,
  TooltipProvider,
} from "@aymurai/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import FileCheck from "../file-check";
import Footer from "../layout/footer";

type AnonymizerExportFormat = "odt" | "pdf";

// Alphabetical by extension, matching the Resumen and Voz a Texto finish
// screens. `.txt` is deferred — adding it here plus one branch in
// resolveExportBlob is the whole frontend change when it lands.
const FORMAT_IDS: AnonymizerExportFormat[] = ["odt", "pdf"];

export default function FinishAnonymizer() {
  const { t } = useTranslation("anonymizer");
  const navigate = useNavigate();
  const file = useFiles().at(0);
  const { tags, words } = useExcludedTagsConfig();

  if (!file) throw new Error("Reached /finish but there's no file to read");

  const inputFormat = getAnonymizerInputFormat(file.data);
  // The anonymizer's natural output: .odt for a .docx input, .pdf for a .pdf
  // input. An unidentifiable input falls back to the docx path, which is what
  // the flow has always produced for anything that is not clearly a PDF.
  const naturalFormat: AnonymizerExportFormat =
    inputFormat === "pdf" ? "pdf" : "odt";

  const [format, setFormat] = useState<AnonymizerExportFormat>(naturalFormat);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const {
    data: anonymizedFile,
    isLoading,
    isError,
    error,
  } = useQuery(aymuraiService.anonymize(file, tags, words));

  const { mutateAsync: convertToPdf } = useMutation(aymuraiService.odtToPdf());
  const { mutateAsync: convertToOdt } = useMutation(aymuraiService.pdfToOdt());

  const exportErrorMessage =
    error instanceof Error ? error.message : t("finish.downloadError");

  useEffect(() => {
    if (!isError) return;
    console.error("Anonymizer export failed:", error);
    showToast(exportErrorMessage, "error");
  }, [error, exportErrorMessage, isError]);

  const handleExport = async () => {
    if (!anonymizedFile) {
      console.error("Tried to download a file that is not ready.");
      return;
    }

    setIsExporting(true);
    setExportError(false);

    try {
      const blob = await resolveExportBlob(anonymizedFile);
      downloadBlob(blob, changeExtension(file.data.name, format));
    } catch (err) {
      console.error("Conversion failed:", err);
      setExportError(true);
    } finally {
      setIsExporting(false);
    }
  };

  // The backend already produced the natural format, so only the cross-format
  // case hits /convert/<in>/<out> — the same two conversions this screen has
  // always used.
  const resolveExportBlob = (source: Blob): Promise<Blob> | Blob => {
    if (format === naturalFormat) return source;
    return naturalFormat === "odt"
      ? convertToPdf(source) // POST /convert/odt/pdf
      : convertToOdt(source); // POST /convert/pdf/odt
  };

  const formatOptions: SelectOption[] = FORMAT_IDS.map((id) => ({
    id,
    text: `.${id}`,
    description: t(`finish.formatDescriptions.${id}`),
  }));

  const handleBack = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Anonymizer },
    });

  return (
    <>
      <MainContent>
        <Stack gap="6">
          <Stack gap="1">
            <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
            <styled.p textStyle="paragraph.md.default">
              {t("finish.description")}
            </styled.p>
          </Stack>
          <Card>
            {/*
              Follows voice-to-text/finish.tsx:105-112 (PR #101), not
              summary-finish.tsx's static grid: stacks to a single column below
              `lg`. `gridTemplateColumns` has no token category in this preset,
              so strictTokens needs no [bracket] escape here.
            */}
            <Grid
              gridTemplateColumns={{
                base: "minmax(0,1fr)",
                lg: "1fr auto 1fr",
              }}
              columnGap="12"
              rowGap="6"
            >
              <Stack gap="4" alignItems="center">
                <styled.h2 textStyle="subtitle.md.strong">
                  {t("finish.subtitle")}
                </styled.h2>
                <FileCheck
                  fileName={file.data.name}
                  hasError={isError}
                  isLoading={isLoading}
                  errorMessage={exportErrorMessage}
                />
              </Stack>

              {/* hideBelow="lg" so the rule vanishes instead of becoming a
                  stray stacked row once the panels are on top of each other —
                  same as voice-to-text/finish.tsx:161-166. */}
              <Divider
                orientation="vertical"
                color="[#BCBAB8]"
                alignSelf="stretch"
                hideBelow="lg"
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
                    onChange={(opt) =>
                      setFormat(opt.id as AnonymizerExportFormat)
                    }
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
            disabled={isError || isLoading || isExporting}
            isLoading={isLoading || isExporting}
          >
            {t("finish.export")}
          </Button>
        </HStack>
      </Footer>
    </>
  );
}

function changeExtension(name: string, ext = "odt") {
  const parts = name.split(".");
  parts.pop();
  return `${parts.join(".")}_anonimizado.${ext}`;
}
