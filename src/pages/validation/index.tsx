import {
  Button,
  Grid,
  SectionTitle,
} from 'components';
import { Footer, Section } from 'layout/main';
import withFileProtection from 'features/withFileProtection';

export default withFileProtection(function Validation() {

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
