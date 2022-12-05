import { Stack } from 'components';
import { useFiles } from 'hooks';
import {
  CaretButton,
  Carousel,
  FileName,
  FileStep,
} from './FileStepper.styles';
import { DocFile } from 'types/file';
import Icons from './Icons';

interface Props {
  selected: number;
  previousFile: () => void;
  nextFile: () => void;
}
export default function FileStepper({
  selected,
  previousFile,
  nextFile,
}: Props) {
  const files = useFiles();

  const isLeftDisabled = selected === 0;
  const isRightDisabled = selected === files.length - 1; // -1 because we are using base 0 notation

  const getStatus = (current: number, file: DocFile) => {
    if (file.validated) {
      return 'completed';
    } else {
      return selected === current ? 'focus' : 'default';
    }
  };

  return (
    <Stack css={{ overflow: 'scroll', p: '$s' }}>
      {/* <- */}
      <CaretButton
        variant="tertiary"
        disabled={isLeftDisabled}
        onClick={previousFile}
      >
        <Icons.ArrowLeft />
      </CaretButton>

      {/* List of files */}
      <Carousel>
        {files.map((file, i) => (
          <FileStep key={file.data.name} status={getStatus(i, file)}>
            <FileName>{file.data.name}</FileName>
            <Icons.Check status={getStatus(i, file)} />
          </FileStep>
        ))}
      </Carousel>

      {/* -> */}
      <CaretButton
        variant="tertiary"
        disabled={isRightDisabled}
        onClick={nextFile}
      >
        <Icons.ArrowRight />
      </CaretButton>
    </Stack>
  );
}
