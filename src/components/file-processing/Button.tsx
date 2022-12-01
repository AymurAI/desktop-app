import { Stop, ArrowCounterClockwise as Restart } from 'phosphor-react';

import { Button as BaseButton } from 'components';
import { FileStatus } from 'hooks/usePredict';

interface Props {
  status: FileStatus;
  onStop?: () => void;
  onReplace?: () => void;
}
export default function Button({ status, onStop, onReplace }: Props) {
  const style = {
    width: 200,
  };

  return status === 'processing' ? (
    <BaseButton onClick={onStop} variant="secondary" css={style}>
      <Stop />
      Detener
    </BaseButton>
  ) : (
    <BaseButton onClick={onReplace} variant="secondary" css={style}>
      <Restart />
      Reemplazar archivo
    </BaseButton>
  );
}
