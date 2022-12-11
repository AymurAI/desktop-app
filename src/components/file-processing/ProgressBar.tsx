import { Label, Stack } from 'components';
import { PredictStatus } from 'hooks/usePredict';
import { Bar, BarContainer } from './FileProcessing.styles';

interface Props {
  fileName: string;
  progress: number;
  status: PredictStatus;
}
export default function ProgressBar({ fileName, progress, status }: Props) {
  const getProgressText = () => {
    const text = {
      processing: `${progress}%`,
      completed: `${progress}%`,
      error: 'Error de carga de archivo. Volvelo a intentar',
      stopped: 'Detuviste el procesamiento de este archivo',
    };

    return text[status];
  };

  return (
    <Stack direction="column" align="stretch" spacing="s" css={{ flex: 1 }}>
      {/* Texts */}
      <Stack justify="space-between">
        <Label status={status === 'error' ? 'error' : 'default'}>
          {fileName}
        </Label>
        <Label
          status={status === 'error' ? 'error' : 'default'}
          css={{ fontStyle: 'italic' }}
        >
          {getProgressText()}
        </Label>
      </Stack>

      <BarContainer>
        <Bar css={{ width: `${progress}%` }} />
      </BarContainer>
    </Stack>
  );
}
