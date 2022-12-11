import { Circle } from 'phosphor-react';
import {
  ChangeEventHandler,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react';

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
export default forwardRef<{ value: boolean }, Props>(function Radio(
  { name, checked = false, disabled = false, onChange, css, children },
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
});
