import { useState } from "react";

import Footer from "@/components/layout/footer";
import { useFileDispatch, useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { validate } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { Grid, HStack, Stack } from "@/styled/jsx";
import { isFileValidated, isValidationCompleted } from "@/utils/file";
import { Button } from "@aymurai/ui";
import { useNavigate, useParams } from "@tanstack/react-router";
import FileAnnotator from "../file-annotator";
import FileStepper from "../file-stepper";
import FormGroup from "./form-group";
import { moveNext, movePrevious } from "./utils";

export function ValidateDataset() {
  // HOOKS
  const { feature } = useParams({ from: "/app/$feature/validation" });
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
          key={selectedFile.data.name}
          file={selectedFile}
          isAnnotable={false}
        />
        <Stack
          // position:relative makes this scrolling column the containing block
          // for the Radix Select's hidden absolutely-positioned native <select>
          // elements. Without it they resolve against <html>, escape this
          // column's overflow, and stretch the page far past the footer.
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
              Continuar
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
