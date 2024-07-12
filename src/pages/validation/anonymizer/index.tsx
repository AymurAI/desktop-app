import { Button, Grid } from 'components';
import FileAnnotator from 'components/file-annotator';
import withFileProtection from 'features/withFileProtection';
import { useFiles } from 'hooks';
import { Footer } from 'layout/main';
import { useNavigate } from 'react-router-dom';

export default withFileProtection(function Validation() {
  const file = useFiles()[0]!;
  const navigate = useNavigate();

  const handleContinue = () => navigate('/finish/anonymizer');

  return (
    <>
      <Grid
        columns={1}
        spacing="none"
        justify="stretch"
        align="stretch"
        css={{ overflow: 'hidden' }}
      >
        <FileAnnotator {...{ file }} isAnnotable></FileAnnotator>
      </Grid>

      <Footer
        css={{
          justifyContent: 'flex-end',
          gap: 150,
        }}
      >
        <Button size="l" onClick={handleContinue}>
          Anonimizar documento
        </Button>
      </Footer>
    </>
  );
});
