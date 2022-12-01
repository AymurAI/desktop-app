import {
  Grid,
} from 'components';
import { Footer, Section } from 'layout/main';
import withFileProtection from 'features/withFileProtection';

export default withFileProtection(function Validation() {

  return (
    <>
      <Grid columns={2} spacing="none" justify="stretch" align="stretch">
        <Section css={{ px: 100 }} spacing="xxl">
        </Section>
      </Grid>
      <Footer
      >
      </Footer>
    </>
  );
});
