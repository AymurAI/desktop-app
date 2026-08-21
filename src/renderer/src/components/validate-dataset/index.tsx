import { useState } from "react";

import Footer from "@/components/layout/footer";
import { useFileDispatch, useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { validate } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { Grid, HStack, Stack } from "@/styled/jsx";
import { featureNamespace } from "@/types/features";
import { isFileValidated, isValidationCompleted } from "@/utils/file";
import { Button } from "@aymurai/ui";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import FileAnnotator from "../file-annotator";
import FileStepper from "../file-stepper";
import FormGroup from "./form-group";
import { moveNext, movePrevious } from "./utils";

export function ValidateDataset() {
  // HOOKS
  const { feature } = useParams({ from: "/app/$feature/validation" });
  const { t } = useTranslation(featureNamespace[feature]);
  const files = useFiles();
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState(0);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

  // FIELDS
  const hasStepper = files.length > 1;

  const selectedFile = files[selected];
  // Check if the validation was completed on all the files
  const canContinue = isValidationCompleted(files);
  const canValidate = isFileValidated(selectedFile);

  // HANDLERS
  const moveIndex = (newIndex: number | undefined) => {
    if (newIndex !== undefined) setSelected(newIndex);
  };
  const nextFile = () => moveIndex(moveNext(selected, files));
  const previousFile = () => moveIndex(movePrevious(selected, files));

  const handleContinue = () => {
    navigate({
      to: "/app/$feature/finish",
      params: { feature },
    });
  };

  const handleValidate = async () => {
    // Set validated = true so the file is no longer accesible through the FileStepper component
    dispatch(validate(selectedFile.data.name));

    if (canContinue || !hasStepper) {
      handleContinue();
    } else {
      nextFile();
    }
  };

  const handleCheck = (checked: boolean) => {
    setChecked(checked);
  };

  return (
    // Render the Grid and Footer as direct children of the app shell's flex
    // column (like the Anonimizador validation route) so the shell's 100vh +
    // overflow:hidden bounds them. An extra wrapping Stack here let content
    // escape the height constraint and produced a spurious page-level scrollbar.
    <>
      <Grid
        flex="1"
        minHeight="0"
        overflow="hidden"
        gap="0"
        // Rule E: a fluid document pane beside a FIXED 594px form column
        // (sizes.panel.form) at >=desktop. gridTemplateColumns/Rows have no
        // token category in this preset (raw CssProperties type, verified in
        // styled/types/style-props.d.ts) so strictTokens does not require the
        // [bracket] escape here - it is used anyway for the multi-value CSS
        // list, consistent with the escape `token()` needs to resolve.
        // 1024-1439 (`lg`) keeps the pre-existing 50/50 fallback: no design
        // exists for that range.
        gridTemplateColumns={{
          base: "[minmax(0, 1fr)]",
          lg: "[repeat(2, minmax(0, 1fr))]",
          desktop: "[minmax(0, 1fr) token(sizes.panel.form)]",
        }}
        gridTemplateRows={{
          // G1 criterio 3: el documento se lleva la mayor parte del alto de
          // la fila apilada de abajo de `lg` (768) - el 50/50 anterior
          // dejaba visible menos de una linea y media del formulario y
          // cortaba el documento a ~13 lineas. El formulario conserva su
          // propio scroll (`overflowY: auto`, mas abajo en este archivo).
          base: "[minmax(0, 62%) minmax(0, 1fr)]",
          lg: "[minmax(0, 1fr)]",
        }}
      >
        <FileAnnotator
          key={selectedFile.data.name}
          file={selectedFile}
          isAnnotable={false}
          // Forces ReadingColumn's rule-C ("doc") geometry: a form column
          // sits beside the document here, unlike the other two screens.
          // FLAGGED FOR DESIGN: with `isAnnotable={false}` the panel never
          // opens, so absent this prop the column would render rule A
          // (`full`, 1824px cap) - but Figma's family-E frames show the
          // document narrow and centered (rule C) even though no panel is
          // open. This prop makes the code match the mockups; the
          // discrepancy between "no panel open -> rule A" and "form beside
          // document -> rule C" is a real open question for design (see
          // tasks/responsive/plan.md's RSP-08 section).
          narrowDocument
        />
        <Stack
          // position:relative makes this scrolling column the containing block
          // for the Radix Select's hidden absolutely-positioned native <select>
          // elements. Without it they resolve against <html>, escape this
          // column's overflow, and stretch the page far past the footer.
          position="relative"
          px={{ base: "6", desktop: "12" }}
          py={{ base: "6", xl: "16" }}
          overflowY="auto"
          overflowX="hidden"
          gap={{ base: "8", xl: "16" }}
          bg="bg.primary"
          minHeight="0"
          minWidth="0"
        >
          <SectionTitle className={css({ whiteSpace: "nowrap" })}>
            3. Validación de datos
          </SectionTitle>
          <FormGroup
            key={selectedFile.data.name}
            file={selectedFile}
            onCheck={handleCheck}
          />
        </Stack>
      </Grid>
      <Footer withBuiltBy>
        <HStack
          alignItems="center"
          width="full"
          justify={hasStepper ? "space-between" : "flex-end"}
          gap="36"
        >
          {hasStepper && (
            <FileStepper {...{ selected, nextFile, previousFile }} />
          )}

          {canContinue ? (
            <Button size="md" onClick={handleContinue}>
              {t("validation.continue")}
            </Button>
          ) : (
            <Button
              size="md"
              onClick={handleValidate}
              disabled={!checked && !canValidate}
            >
              Validar documento
            </Button>
          )}
        </HStack>
      </Footer>
    </>
  );
}
