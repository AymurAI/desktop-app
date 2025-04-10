import { FC } from 'react';
import { X } from 'phosphor-react';
import { styled } from 'styles';
import Button from '../button';

export interface DialogOption {
  id: string;
  label: string;
  action: () => void;
}

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  options: DialogOption[];
  onClose: () => void;
}

const Overlay = styled('div', {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

const DialogContainer = styled('div', {
  backgroundColor: '$white',
  borderRadius: '$xs',
  padding: '$l',
  minWidth: 300,
  maxWidth: 500,
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
});

const DialogHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '$m',
});

const DialogTitle = styled('h3', {
  fontSize: '$titleMd',
  fontWeight: 600,
  color: '$textDefault',
  margin: 0,
});

const DialogMessage = styled('p', {
  color: '$textDefault',
  marginBottom: '$l',
});

const DialogButtons = styled('div', {
  display: 'flex',
  gap: '$s',
  justifyContent: 'flex-end',
});

const Dialog: FC<DialogProps> = ({
  isOpen,
  title,
  message,
  options,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <DialogContainer>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Button variant="none" onClick={onClose}>
            <X size={24} />
          </Button>
        </DialogHeader>
        <DialogMessage>{message}</DialogMessage>
        <DialogButtons>
          {options.map((option, index) => (
            <Button
              key={option.id}
              variant={index === options.length - 1 ? 'primary' : 'secondary'}
              onClick={option.action}
            >
              {option.label}
            </Button>
          ))}
        </DialogButtons>
      </DialogContainer>
    </Overlay>
  );
};

export default Dialog; 