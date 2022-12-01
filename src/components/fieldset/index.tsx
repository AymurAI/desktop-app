import { ReactNode } from 'react';

import { Fieldset as StyledFieldset, Legend } from './Fieldset.styles';

interface Props {
  children: ReactNode;
  title: string;
}
export default function Fieldset({ children, title }: Props) {
  return (
    <StyledFieldset>
      <Legend>{title}</Legend>
      {children}
    </StyledFieldset>
  );
}
