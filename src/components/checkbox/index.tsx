import { ChangeEventHandler, ReactNode, useState } from 'react';
import { Check } from 'phosphor-react';

import { colors } from 'styles/tokens';
import { Input, Wrapper, Checkbox as StyledCheckbox } from './Checkbox.styles';

interface Props {
  children?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
}
export default function Checkbox({
  children,
  disabled = false,
  checked = false,
}: Props) {
  const [isChecked, setIsChecked] = useState(checked);

  const hasText = !!children;

  const handleToggleCheck: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsChecked(e.target.checked);
  };

  const iconColor = disabled
    ? colors.textOnButtonDisabled
    : colors.textOnButtonAlternative;

  return (
    <Wrapper hasText={hasText} isDisabled={disabled}>
      <Input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleToggleCheck}
      />
      <StyledCheckbox>
        <Check color={iconColor} weight="bold"></Check>
      </StyledCheckbox>
      {children}
    </Wrapper>
  );
}
