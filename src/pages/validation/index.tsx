import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  FileContainer,
  FileStepper,
  Grid,
  SectionTitle,
} from 'components';
import { useFileDispatch, useFiles } from 'hooks';
import { Footer, Section } from 'layout/main';
import withFileProtection from 'features/withFileProtection';
import { validate } from 'reducers/file/actions';

export default withFileProtection(function Validation() {
  const files = useFiles();
  const [selected, setSelected] = useState(0);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

  const stepperEnabled = files.length > 1;
  const nextFile = () => setSelected(selected + 1);
  const previousFile = () => setSelected(selected - 1);

  const selectedFile = files[selected];
  const handleValidate = () => {
    dispatch(validate(selectedFile.data.name));
    nextFile();
  };

  const handleContinue = () => {
    navigate('/finish');
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
        </Section>
      </Grid>
      <Footer
        css={{
          justifyContent: stepperEnabled ? 'space-between' : 'flex-end',
          gap: 150,
        }}
      >
        {stepperEnabled && (
          <FileStepper {...{ selected, nextFile, previousFile }} />
        )}
        <Button size="l">Validar documento</Button>
      </Footer>
    </>
  );
});
