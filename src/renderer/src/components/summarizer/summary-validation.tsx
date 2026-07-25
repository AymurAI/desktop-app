import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import DocumentSearchPanel from "@/components/summarizer/document-search-panel";
import {
  edit,
  editTitle,
  useSummary,
  useSummaryDispatch,
} from "@/context/Summary";
import { useFiles } from "@/hooks";
import { summaryValidationClient } from "@/services/aymurai/summaryValidationClient";
import { css } from "@/styled/css";
import { Grid } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import {
  Button,
  Callout,
  RichTextEditor,
  serializeDocumentToPlainText,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Grid items stretch to the row height by default, but their content can
// still overflow that stretched box unless min-height is pinned to 0 —
// without it the taller of the two panes (whichever has more content) pushes
// the whole row past the header/footer instead of scrolling internally.
// height:"full" gives each pane's own internal Stack/panel a definite size
// to resolve its own height:"full" against.
const validationPane = css({
  height: "full",
  minHeight: "[0]",
  overflow: "hidden",
});

export default function SummaryValidation() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const files = useFiles();
  const file = files[0];
  const summary = useSummary();
  const dispatch = useSummaryDispatch();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // The editor's onBlur and the "Finalizar" button can both try to save
  // within the same click (focus leaves the editor, then the click handler
  // fires its own save) — without dedup that's two independent,
  // uncoordinated network writes racing each other for the saving/saveFailed
  // state. Track the in-flight save so a second call while one is pending
  // reuses it instead of starting another.
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);

  // Resolves to `false` only when the save actually failed — lets callers
  // that navigate away decide whether to wait for a clean save first.
  const handleSave = (): Promise<boolean> => {
    if (inFlightSaveRef.current) return inFlightSaveRef.current;
    if (!file || !summary.document) return Promise.resolve(true);

    setSaving(true);
    setSaveFailed(false);

    const promise = summaryValidationClient
      .save({
        documentId: file.data.name,
        title: summary.title,
        generatedSummary: summary.partialText,
        editedSummary: serializeDocumentToPlainText(summary.document),
      })
      .then(() => true)
      .catch(() => {
        setSaveFailed(true);
        return false;
      })
      .finally(() => {
        setSaving(false);
        inFlightSaveRef.current = null;
      });

    inFlightSaveRef.current = promise;
    return promise;
  };

  // Save-then-navigate for leaving the screen. Awaits the save so the
  // outcome is known (and, on failure, rendered) before we ever navigate
  // away — a fire-and-forget save here would run its .catch/.finally against
  // an unmounting component and the saveFailed Callout would never get a
  // chance to show. If the save fails, we stay on this screen so the user
  // sees why; a second click (with saveFailed already true) lets them
  // continue anyway, matching the "podés continuar, pero los cambios podrían
  // no quedar persistidos" copy.
  const handleContinue = async () => {
    const to = "/app/$feature/finish" as const;
    if (saveFailed) {
      navigate({ to, params: { feature: FeatureFlowEnum.Summarizer } });
      return;
    }
    const saved = await handleSave();
    if (saved) {
      navigate({ to, params: { feature: FeatureFlowEnum.Summarizer } });
    }
  };

  if (!summary.document || !file) return null;

  const hasSummary = summary.document.paragraphs.length > 0;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={3} />
      <Grid
        columns={2}
        gap="0"
        flex="1"
        minHeight="0"
        overflow="hidden"
        justifyContent="stretch"
        alignItems="stretch"
      >
        <section
          className={validationPane}
          aria-label={t("validation.originalDocumentLabel")}
        >
          <DocumentSearchPanel paragraphs={file.paragraphs ?? []} />
        </section>
        <div className={validationPane} onBlur={handleSave}>
          {hasSummary ? (
            <RichTextEditor
              document={summary.document}
              onChange={(next) => dispatch(edit(next))}
              title={summary.title}
              onTitleChange={(next) => dispatch(editTitle(next))}
              aria-label={t("validation.summaryLabel")}
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
        <Button onClick={handleContinue}>{t("validation.finish")}</Button>
      </Footer>
    </>
  );
}
