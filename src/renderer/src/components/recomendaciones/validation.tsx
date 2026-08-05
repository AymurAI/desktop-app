import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ExtractedValueAnnotation } from "@/components/file-annotator/types";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import RequireFile from "@/features/RequireFile";
import { showToast } from "@/features/showToast";
import { useFileDispatch, useFiles } from "@/hooks";
import { toValidationPayload } from "@/hooks/useRecomendacionForm";
import { SectionTitle } from "@/layout/section-title";
import { setRecomendacion, validate } from "@/reducers/file/actions";
import { recomendacionValidationMutation } from "@/services/aymurai/queries";
import { css } from "@/styled/css";
import { Grid, Stack } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { buildExtractedAnnotations } from "@/utils/recomendaciones/build-annotations";
import { Button, Callout } from "@aymurai/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import FileAnnotator from "../file-annotator";
import { RecomendacionForm } from "./recomendacion-form";

const EMPTY_ANNOTATIONS = new Map<string, ExtractedValueAnnotation[]>();

/**
 * Recomendaciones' validation screen: the payoff of the flow. Consumes the
 * `RecomendacionState` a previous stage already attached to `file.recomendacion`
 * (`useDataExtraction`) — this screen does not fetch anything itself.
 */
export function RecomendacionValidation() {
  const feature = FeatureFlowEnum.Recomendaciones;
  const { t } = useTranslation(featureNamespace[feature]);
  const navigate = useNavigate();
  const dispatch = useFileDispatch();
  const file = useFiles()[0];
  const recomendacion = file?.recomendacion;

  const saveMutation = useMutation(recomendacionValidationMutation());

  const [values, setValues] = useState<RecomendacionValues | null>(
    recomendacion?.values ?? null,
  );
  const [activeField, setActiveField] = useState<string | null>(null);

  // §X3: the fuzzy-matching path in `locateValue` was measured at ~1s on a
  // large repetitive document. Recomputing `buildExtractedAnnotations` on
  // every keystroke would make typing lag, so the highlight recomputation
  // reacts to a deferred snapshot of `values`, not the live one.
  const deferredValues = useDeferredValue(values);

  const annotations = useMemo(() => {
    if (!deferredValues) return EMPTY_ANNOTATIONS;
    return buildExtractedAnnotations(deferredValues, file?.paragraphs ?? []);
  }, [deferredValues, file?.paragraphs]);

  const handleValidate = async () => {
    if (!file || !recomendacion || !values) return;

    try {
      await saveMutation.mutateAsync({
        documentId: recomendacion.documentId,
        validation: toValidationPayload(values),
      });
    } catch {
      // The persistence endpoint doesn't exist on the backend yet, so a
      // failing save is the EXPECTED path today. It must never block the
      // user from finishing (mirrors voice-to-text/validation.tsx).
      showToast(t("validation.saveFailed"), "warning");
    }

    // Write the edited values BACK into `file.recomendacion`. `values` lives in
    // this screen's local state, but `finish.tsx` reads
    // `file.recomendacion.values` to build the Excel row — without this
    // dispatch the only working persistence path would export the raw LLM
    // inference and silently drop every human correction. Spreading
    // `recomendacion` keeps `inference` and `suggestions` pointing at the
    // very same objects, so the frozen-suggestions invariant holds and
    // reopening the screen still diffs edits against the original model
    // output.
    dispatch(
      setRecomendacion(file.data.name, {
        ...recomendacion,
        origin: "validation",
        values,
      }),
    );
    dispatch(validate(file.data.name));
    navigate({ to: "/app/$feature/finish", params: { feature } });
  };

  return (
    <RequireFile>
      <Header title={t("title")} currentStep={3} feature={feature} />
      {file && recomendacion && (
        <>
          {/* Render the Grid and Footer as direct children of the app
              shell's flex column (like the Anonimizador validation route)
              so the shell's 100vh + overflow:hidden bounds them. An extra
              wrapping Stack here let content escape the height constraint
              and produced a spurious page-level scrollbar. */}
          <Grid
            flex="1"
            minHeight="0"
            overflow="hidden"
            gap="0"
            gridTemplateColumns={{
              base: "minmax(0, 1fr)",
              lg: "repeat(2, minmax(0, 1fr))",
            }}
            gridTemplateRows={{
              base: "repeat(2, minmax(0, 1fr))",
              lg: "minmax(0, 1fr)",
            }}
          >
            <FileAnnotator
              file={file}
              isAnnotable={false}
              extraAnnotations={annotations}
              activeField={activeField}
            />
            <Stack
              // position:relative makes this scrolling column the containing
              // block for the Radix Select's hidden absolutely-positioned
              // native <select> elements. Without it they resolve against
              // <html>, escape this column's overflow, and stretch the page
              // far past the footer.
              position="relative"
              px={{ base: "6", xl: "[100px]" }}
              py={{ base: "6", xl: "16" }}
              overflowY="auto"
              overflowX="hidden"
              gap={{ base: "8", xl: "16" }}
              bg="bg.primary"
              minHeight="0"
              minWidth="0"
            >
              <SectionTitle className={css({ whiteSpace: "nowrap" })}>
                {t("validation.sectionTitle")}
              </SectionTitle>
              {recomendacion.origin === "stored-inference" && (
                <Callout
                  message={t("validation.storedInference")}
                  variant="info"
                />
              )}
              {recomendacion.origin === "validation" && (
                <Callout
                  message={t("validation.alreadyValidated")}
                  variant="success"
                />
              )}
              <RecomendacionForm
                state={recomendacion}
                onValuesChange={setValues}
                onActiveFieldChange={setActiveField}
              />
            </Stack>
          </Grid>
          <Footer withBuiltBy>
            <Button
              size="md"
              onClick={handleValidate}
              disabled={saveMutation.isPending}
            >
              {t("validation.validar")}
            </Button>
          </Footer>
        </>
      )}
    </RequireFile>
  );
}
