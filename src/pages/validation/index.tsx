import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  FileContainer,
  FileStepper,
  Grid,
  SectionTitle,
} from "components";
import { useFileDispatch, useFiles, useUser } from "hooks";
import { Footer, Section } from "layout/main";
import FormGroup from "./form-group";
import withFileProtection from "features/withFileProtection";
import { isFileValidated, isValidationCompleted } from "utils/file";
import { validate } from "reducers/file/actions";
import { moveNext, movePrevious } from "./utils";

import { FunctionType } from "types/user";

export default withFileProtection(function Validation() {
  // HOOKS
  const files = useFiles();
  const [selected, setSelected] = useState(0);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const user = useUser();

  // FIELDS
  const hasStepper = files.length > 1;

  const selectedFile = files[selected];
  // Check if the validation was completed on all the files
  const canContinue = isValidationCompleted(files);
  const canValidate =
    user?.function === FunctionType.ANONYMIZER
      ? true
      : isFileValidated(selectedFile);

  // HANDLERS
  const moveIndex = (newIndex: number | undefined) => {
    if (newIndex !== undefined) setSelected(newIndex);
  };
  const nextFile = () => moveIndex(moveNext(selected, files));
  const previousFile = () => moveIndex(movePrevious(selected, files));

  const handleContinue = () => {
    navigate("/finish");
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

  return (
    <>
      <Grid
        columns={user?.function === FunctionType.ANONYMIZER ? 1 : 2}
        spacing="none"
        justify="stretch"
        align="stretch"
        css={{ overflow: "hidden" }}
      >
        <FileContainer
          key={selectedFile.data.name}
          file={selectedFile}
        ></FileContainer>
        {user?.function === FunctionType.DATASET && (
          <Section css={{ px: 100, overflowY: "scroll" }} spacing="xxl">
            <SectionTitle>3. Validación de datos</SectionTitle>
            <FormGroup key={selectedFile.data.name} file={selectedFile} />
          </Section>
        )}
      </Grid>
      <Footer
        css={{
          justifyContent: hasStepper ? "space-between" : "flex-end",
          gap: 150,
        }}
      >
        {hasStepper && (
          <FileStepper {...{ selected, nextFile, previousFile }} />
        )}

        {canContinue ? (
          <Button size="l" onClick={handleContinue}>
            Continuar
          </Button>
        ) : (
          <Button size="l" onClick={handleValidate} disabled={!canValidate}>
            {user?.function === FunctionType.ANONYMIZER
              ? "Anonimizar documento"
              : "Validar documento"}
          </Button>
        )}
      </Footer>
    </>
  );
});
