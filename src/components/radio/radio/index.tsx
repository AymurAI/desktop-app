import { Circle } from 'phosphor-react';
import { ChangeEventHandler, ReactNode, useState } from 'react';

import { CSS } from 'styles';
import { colors } from 'styles/tokens';
import { Wrapper, Input, Radio as StyledRadio } from './Radio.styles';

export interface Props {
  children?: ReactNode;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  css?: CSS;
}
export default function Radio({
  name,
  checked = false,
  disabled = false,
  onChange,
  css,
  children,
}: Props) {
  const [isChecked, setIsChecked] = useState(checked);

  const hasText = !!children;

  const handleToggle: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsChecked(e.target.checked);
    onChange?.(isChecked);
  };

  const iconColor = disabled
    ? colors.textOnButtonDisabled
    : colors.textOnButtonAlternative;

  return (
    <Wrapper hasText={hasText} isDisabled={disabled} css={css}>
      <Input
        type="radio"
        name={name}
        checked={isChecked}
        disabled={disabled}
        onChange={handleToggle}
      />
      <StyledRadio>
        <Circle color={iconColor} weight="fill" />
      </StyledRadio>
      {children}
    </Wrapper>
  );
}
