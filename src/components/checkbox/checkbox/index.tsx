import {
  ChangeEventHandler,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react';
import { Check } from 'phosphor-react';

import { colors } from 'styles/tokens';
import { Input, Wrapper, Checkbox as StyledCheckbox } from './Checkbox.styles';
import { CSS } from 'styles';

export interface Props {
  children?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  name?: string;
  css?: CSS;
}
export default forwardRef<{ value: boolean }, Props>(function Checkbox(
  { disabled = false, checked = false, name, onChange, children, css },
  ref
) {
  const [isChecked, setIsChecked] = useState(checked);

  const hasText = !!children;

  // Only exposes `value` object to the parent component
  useImperativeHandle(
    ref,
    () => {
      return {
        value: isChecked,
      };
    },
    [isChecked]
  );

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
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleToggle}
        name={name}
      />
      <StyledCheckbox>
        <Check color={iconColor} weight="bold"></Check>
      </StyledCheckbox>
      {children}
    </Wrapper>
  );
});
