import { CheckCircle } from 'phosphor-react';

import { Text } from 'components';
import { colors } from 'styles/tokens';
import { Card, Wrapper } from './FileCheck.styles';

interface Props {
  fileName: string;
}
export default function FileCheck({ fileName }: Props) {
  return (
    <Wrapper>
      <Card>
        <CheckCircle size={48} color={colors.primary} />
      </Card>
      <Text>{fileName}</Text>
    </Wrapper>
  );
}
