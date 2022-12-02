import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';

import { Props as RadioProps } from '../radio';
import { Group, Legend } from './RadioGroup.styles';

interface Props {
  children: ReactNode;
  title?: string;
  name: string;
  direction?: 'horizontal' | 'vertical';
}
export default function RadioGroup({
  title,
  name,
  direction = 'horizontal',
  children,
}: Props) {
  // Inject the name to the children
  const radiosWithName = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<RadioProps>, {
        name,
      });
    }
  });

  return (
    <Group direction={direction}>
      {title && <Legend>{title}</Legend>}
      {radiosWithName}
    </Group>
  );
}
