import { FC, HTMLAttributes, useState } from 'react';
import { useAnnotation } from 'context/Annotation';
import * as S from './FileAnnotator.styles';
import { Annotation, LabelAnnotation, Metadata } from './types';
import Dialog, { DialogMessage, DialogButtons } from '../dialog';
import Button from '../button';
import Input from 'components/input';
import Select, { SelectOption } from 'components/select';
import { anonymizerLabels } from 'types/aymurai';

interface MarkProps extends HTMLAttributes<HTMLSpanElement> {
  annotation: Annotation;
  children: string;
}

type DialogOption = {
  id: string;
  label: string;
  action: () => void;
};

export const Mark: FC<MarkProps> = ({ children, annotation, ...props }) => {
  const { add, remove, removeByText, isAnnotable } = useAnnotation();
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    step: 'replace' | 'options';
  }>({
    open: false,
    step: 'options',
  });

  const annotationOperations = {
    add,
    remove,
    removeByText,
  };

  let metadata: Metadata = {
    'data-start': annotation.start,
    'data-end': annotation.end,
  };

  if (annotation.type !== 'text') {
    metadata = {
      ...metadata,
      'data-tag': annotation.tag,
    };
  }

  const createAnnotationData = (annotation: LabelAnnotation) => {
    const { start, end, paragraphId, tag } = annotation;
    if (!tag) return null;
    return {
      text: children,
      start_char: start,
      end_char: end,
      paragraphId: paragraphId,
      attrs: {
        aymurai_label: tag,
        aymurai_label_subclass: null,
        aymurai_alt_text: null,
        aymurai_alt_start_char: start,
        aymurai_alt_end_char: end,
      },
    };
  };

  const handleAnnotationOperation = (operation: keyof typeof annotationOperations) => {
    const annotationData = createAnnotationData(annotation as LabelAnnotation);
    if (!annotationData) return;

    annotationOperations[operation](annotationData);
    setDialogState({
      open: false,
      step: 'options',
    });
  };

  const handleReplaceTag = () => {
    setDialogState({
      open: false,
      step: 'options',
    });
  };

  const handleReplaceAllTags = () => {
    setDialogState({
      open: false,
      step: 'options',
    });
  };

  const dialogOptions: DialogOption[] = [
    {
      id: 'remove-tag',
      label: 'Remover esta etiqueta',
      action: () => handleAnnotationOperation('remove'),
    },
    {
      id: 'remove-all-tags',
      label: 'Remover todas las etiquetas',
      action: () => handleAnnotationOperation('removeByText'),
    },
    {
      id: 'replace-tag',
      label: 'Reemplazar esta etiqueta',
      action: () => setDialogState({
        open: true,
        step: 'replace',
      }),
    },
    {
      id: 'replace-all-tags',
      label: 'Reemplazar todas las etiquetas',
      action: () => setDialogState({
        open: true,
        step: 'replace',
      }),
    },
  ];

  const clickHandler = () => {
    if (annotation.type === 'search') {
      handleAnnotationOperation('add');
    } else {
      setDialogState({
        open: true,
        step: 'options',
      });
    }
  };

  const changeLabelSelectHandler = (option: SelectOption | undefined) => {
    console.log(option);
  };

  switch (annotation.type) {
    case 'tag':
    case 'search':
      return (
        <>
          <S.Mark
            type={annotation.type}
            annotable={Boolean(false)}
            className={`${annotation.type}`}
            {...props}
            {...metadata}
          >
            <span>{children}</span>

            {annotation.type === 'tag' && <strong>{annotation.tag}</strong>}
            {isAnnotable && annotation.tag && (
              <S.Button type={annotation.type} onClick={clickHandler} />
            )}
          </S.Mark>
          <Dialog
            isOpen={dialogState.open}
            title="Elige una opción"
            onClose={() => setDialogState({
              open: false,
              step: 'options',
            })}
          >
            {dialogState.step === 'options' ? (
              <>
                <DialogMessage>Por favor, elige la opción que quieres realizar.</DialogMessage>
                <DialogButtons>
                  {dialogOptions.map(({ id, label, action }, index) => (
                    <Button
                      key={id}
                      variant={index === dialogOptions.length - 1 ? 'primary' : 'secondary'}
                      onClick={() => {
                        action();
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </DialogButtons>
              </>
            ) : (
              <>
                <DialogMessage>Por favor, introduce el nuevo texto para reemplazar la etiqueta.</DialogMessage>
                <DialogButtons>
                  <Select
                    placeholder="Seleccione una opción"
                    options={anonymizerLabels}
                    onChange={changeLabelSelectHandler}
                  />
                  <Button variant="secondary" onClick={() => setDialogState({
                    open: true,
                    step: 'options',
                  })}>Volver</Button>
                  <Button variant="primary" onClick={() => setDialogState({
                    open: true,
                    step: 'options',
                  })}>Reemplazar</Button>
                </DialogButtons>
              </>
            )}
          </Dialog>
        </>
      );
    case 'text':
    default:
      return (
        <span {...props} {...metadata}>
          {children}
        </span>
      );
  }
};
