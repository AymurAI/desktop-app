import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  FileContainer,
  FileStepper,
  Grid,
  SectionTitle,
} from 'components';
import { useFileDispatch, useFiles, useGoogleToken, useUser } from 'hooks';
import { Footer, Section } from 'layout/main';
import FormGroup from './form-group';
import withFileProtection from 'features/withFileProtection';
import {
  isFileValidated,
  isValidationCompleted,
  submitValidations,
} from 'utils/file';
import { validate } from 'reducers/file/actions';
import { moveNext, movePrevious } from './utils';
import exportFeedback from 'services/feedback';

export default withFileProtection(function Validation() {
  // HOOKS
  const files = useFiles();
  const [selected, setSelected] = useState(0);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const token = useGoogleToken();
  const user = useUser();

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
    navigate('/finish');
  };

  const handleValidate = async () => {
    dispatch(validate(selectedFile.data.name));

    // TODO Verificar que no sea necesario un `if(token)` en esta linea
    if (canContinue || !hasStepper) {
      handleContinue();
    } else {
      nextFile();
    }
    // POST the validated data to the dataset
    await submitValidations({
      online: user?.online,
      token,
      validations: selectedFile.validationObject,
    });

    // Export the feedback JSON
    await exportFeedback(selectedFile);
  };

  return (
    <>
      <Grid
        columns={2}
        spacing="none"
        justify="stretch"
        align="stretch"
        css={{ overflow: 'hidden' }}
      >
        <FileContainer
          key={selectedFile.data.name}
          file={selectedFile}
        ></FileContainer>
        <Section css={{ px: 100, overflowY: 'scroll' }} spacing="xxl">
          <SectionTitle>3. Validación de datos</SectionTitle>
          <FormGroup key={selectedFile.data.name} file={selectedFile} />
        </Section>
      </Grid>
      <Footer
        css={{
          justifyContent: hasStepper ? 'space-between' : 'flex-end',
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
            Validar documento
          </Button>
        )}
      </Footer>
    </>
  );
});
