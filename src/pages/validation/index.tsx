import { useState } from 'react';

import {
  Button,
  Grid,
  SectionTitle,
} from 'components';
import { useFiles } from 'hooks';
import { Footer, Section } from 'layout/main';
import withFileProtection from 'features/withFileProtection';

export default withFileProtection(function Validation() {
  const files = useFiles();
  const [selected, setSelected] = useState(0);

  const stepperEnabled = files.length > 1;
  const nextFile = () => setSelected(selected + 1);
  const previousFile = () => setSelected(selected - 1);

  const selectedFile = files[selected];

  return (
    <>
      <Grid
        columns={2}
        spacing="none"
        justify="stretch"
        align="stretch"
        css={{ overflow: 'hidden' }}
      >
        <Section css={{ px: 100, overflowY: 'scroll' }} spacing="xxl">
          <SectionTitle>3. Validación de datos</SectionTitle>
        </Section>
      </Grid>
      <Footer
      >
        <Button size="l">Validar documento</Button>
      </Footer>
    </>
  );
});
