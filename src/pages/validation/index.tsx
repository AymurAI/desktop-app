import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  FileContainer,
  FileStepper,
  Grid,
  SectionTitle,
} from 'components';
import { useFileDispatch, useFiles, useGoogleToken } from 'hooks';
import { Footer, Section } from 'layout/main';
import FormGroup from './form-group';
import withFileProtection from 'features/withFileProtection';
import { isFileValidated, isValidationCompleted } from 'utils/file';
import { validate } from 'reducers/file/actions';
import google from 'services/google';
import { spreadsheetURLToId, validationToArray } from 'utils/google';
import { DATASET_URL } from 'utils/config';
import { moveNext, movePrevious } from './utils';
import exportFeedback from 'services/feedback';

export default withFileProtection(function Validation() {
  const files = useFiles();
  const [selected, setSelected] = useState(0);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const token = useGoogleToken();

  const nextFile = () => {
    const newIndex = moveNext(selected, files);
    if (newIndex) setSelected(newIndex);
  };
  const previousFile = () => {
    const newIndex = movePrevious(selected, files);
    if (newIndex) setSelected(newIndex);
  };

  const hasStepper = files.length > 1;

  const selectedFile = files[selected];
  // Check if the validation was completed on all the files
  const canContinue = isValidationCompleted(files);
  const canValidate = isFileValidated(selectedFile);

  const handleContinue = () => {
    navigate('/finish');
  };

  const handleValidate = async () => {
    dispatch(validate(selectedFile.data.name));

    if (token) {
      if (canContinue) {
        handleContinue();
      } else {
        nextFile();
      }

      // POST the validated data to the dataset
      await google(token)
        .spreadsheet(spreadsheetURLToId(DATASET_URL))
        .append(validationToArray(selectedFile.validationObject));

      // Export the feedback JSON
      await exportFeedback(selectedFile);
    } else {
      throw new Error(
        'No token was found, cannot POST the data to the Google API!'
      );
    }
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
