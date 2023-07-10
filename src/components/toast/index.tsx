import { cloneElement } from 'react';
import { X } from 'phosphor-react';

import Label from '../label';
import Button from '../button';

import { Props } from './Toast.types';
import * as S from './Toast.styles';

export default function Toast({
  css,
  children,
  isVisible = false,
  icon,
  onClose,
}: Props) {
  const iconWithProps = cloneElement(icon, { size: 24, color: '#110041' });
  return (
    <S.Container {...{ isVisible, css }}>
      <S.Message>
        {iconWithProps}
        <Label size="m" css={{ color: '$textDefault' }}>
          {children}
        </Label>
      </S.Message>
      <S.Close>
        <Button variant="none" onClick={onClose}>
          <X size={24} />
        </Button>
      </S.Close>
    </S.Container>
  );
}
