import { Label, Stack } from 'components';
import { Bar, BarContainer } from './FileProcessing.styles';

interface Props {
  fileName: string;
  progress: number;
}
export default function ProgressBar({ fileName, progress }: Props) {
  return (
    <Stack direction="column" align="stretch" spacing="s" css={{ flex: 1 }}>
      {/* Texts */}
      <Stack justify="space-between">
        <Label>{fileName}</Label>
        <Label>{`${progress}%`}</Label>
      </Stack>

      <BarContainer>
        <Bar css={{ width: `${progress}%` }} />
      </BarContainer>
    </Stack>
  );
}
