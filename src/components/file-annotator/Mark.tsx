import { FC, HTMLAttributes, useState, useRef } from 'react';
import { useAnnotation } from 'context/Annotation';
import * as S from './FileAnnotator.styles';
import { Annotation, LabelAnnotation, Metadata } from './types';
import Dialog, { DialogMessage, DialogButtons } from '../dialog';
import Button from '../button';
import Input from 'components/input';
import Select, { SelectOption } from 'components/select';
import { anonymizerLabels, AllLabels, AllLabelsWithSufix } from 'types/aymurai';

interface MarkProps extends HTMLAttributes<HTMLSpanElement> {
  annotation: Annotation;
  children: string;
}

type DialogState = {
  open: boolean;
  title: string;
  action: 'replace' | 'replaceAll' | 'remove' | 'removeAll';
  suffix: number | null;
  selectedOption: SelectOption | undefined;
};

export const Mark: FC<MarkProps> = ({ children, annotation, ...props }) => {
  const {
    add,
    remove,
    removeByText,
    isAnnotable,
    updateLabel,
    updateByText,
    addBySearch,
  } = useAnnotation();
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: 'Reemplazar',
    action: 'replace',
    suffix: null,
    selectedOption: undefined,
  });
  const inputLabelSufixRef = useRef<HTMLInputElement>(null);

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

  const handleAnnotationOperation = (
    operation: keyof typeof annotationOperations
  ) => {
    const annotationData = createAnnotationData(annotation as LabelAnnotation);
    if (!annotationData) return;

    if (operation === 'remove' || operation === 'removeByText') {
      setDialogState({
        open: true,
        title: '¿Estás seguro?',
        action: operation === 'remove' ? 'remove' : 'removeAll',
        suffix: null,
        selectedOption: undefined,
      });
    } else {
      annotationOperations[operation](annotationData);
    }
  };

  const handleAddBySearch = (annotation: LabelAnnotation) => {
    if (!annotation?.tag) return;

    addBySearch(children, annotation.tag);
  };

  const changeLabelSelectHandler = (option: SelectOption | undefined) => {
    setDialogState(state => ({
      ...state,
      selectedOption: option,
    }));
  };

  const applyChanges = () => {
    if (!dialogState.selectedOption) {
      if (dialogState.action === 'remove' || dialogState.action === 'removeAll') {
        const annotationData = createAnnotationData(annotation as LabelAnnotation);
        if (!annotationData) return;

        if (dialogState.action === 'remove') {
          remove(annotationData);
        } else {
          removeByText(annotationData);
        }
      }
    } else {
      const annotationData = createAnnotationData(annotation as LabelAnnotation);
      if (!annotationData) return;

      const labelWithSuffix = dialogState.suffix
        ? `${dialogState.selectedOption.id}_${dialogState.suffix}` as AllLabelsWithSufix
        : dialogState.selectedOption.id as AllLabels | AllLabelsWithSufix;

      if (dialogState.action === 'replace') {
        updateLabel(annotationData, labelWithSuffix);
      } else if (dialogState.action === 'replaceAll') {
        updateByText(annotationData, labelWithSuffix);
      }
    }

    setDialogState(state => ({
      ...state,
      open: false,
      suffix: null,
      selectedOption: undefined,
    }));
  };

  const changeLabelSufixHandler = (value: string) => {
    setDialogState(state => ({
      ...state,
      suffix: value ? Number(value) : null,
    }));
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

            {isAnnotable && annotation.type === 'search' && annotation.tag ? (
              <S.ButtonContainer>
                <S.Button
                  type="button"
                  css={{ variant: 'searchSingle' }}
                  onClick={() => handleAnnotationOperation('add')}
                >
                  +
                </S.Button>
                <S.Button
                  type="button"
                  css={{ variant: 'search' }}
                  onClick={() => handleAddBySearch(annotation)}
                >
                  + ALL
                </S.Button>
              </S.ButtonContainer>
            ) : annotation.tag ? (
              <S.ButtonContainer>
                <S.Button
                  type="button"
                  css={{ variant: 'replace' }}
                  onClick={() => {
                    setDialogState({
                      open: true,
                      title: 'Reemplazar esta ocurrencia',
                      action: 'replace',
                      suffix: null,
                      selectedOption: undefined,
                    });
                  }}
                >
                  <img src="/button-icons/replace-one.svg" alt="Replace One" />
                </S.Button>
                <S.Button
                  type="button"
                  css={{ variant: 'replaceAll' }}
                  onClick={() => {
                    setDialogState({
                      open: true,
                      title: 'Reemplazar todas las ocurrencias',
                      action: 'replaceAll',
                      suffix: null,
                      selectedOption: undefined,
                    });
                  }}
                >
                  <img src="/button-icons/replace-all.svg" alt="Replace All" />
                </S.Button>
                <S.Button
                  type="button"
                  css={{ variant: 'tag' }}
                  onClick={() => handleAnnotationOperation('remove')}
                >
                  <img src="/button-icons/delete-one.svg" alt="Delete One" />
                </S.Button>
                <S.Button
                  type="button"
                  css={{ variant: 'tagAll' }}
                  onClick={() => handleAnnotationOperation('removeByText')}
                >
                  <img src="/button-icons/delete-all.svg" alt="Delete All" />
                </S.Button>
              </S.ButtonContainer>
            ) : null}
          </S.Mark>
          <Dialog
            isOpen={dialogState.open}
            title={dialogState.title}
            onClose={() =>
              setDialogState(state => ({
                ...state,
                open: false,
                suffix: null,
                selectedOption: undefined,
              }))
            }
          >
            {dialogState.action === 'remove' || dialogState.action === 'removeAll' ? (
              <>
                <DialogMessage>
                  ¿Deseas {dialogState.action === 'remove' ? 'eliminar esta etiqueta' : 'eliminar todas las etiquetas'} de <b>{children}</b>?
                </DialogMessage>
                <DialogButtons>
                  <Button onClick={applyChanges}>
                    Sí, eliminar
                  </Button>
                  <Button onClick={() => setDialogState(state => ({ ...state, open: false }))}>
                    Cancelar
                  </Button>
                </DialogButtons>
              </>
            ) : (
              <>
                <DialogMessage>
                  Por favor, introduce la nueva etiqueta para reemplazar {dialogState.action === 'replace' ? 'esta ocurrencia' : 'todas las ocurrencias'} de <b>{children}</b>.
                </DialogMessage>
                <DialogButtons>
                  <Select
                    placeholder="Seleccione una opción"
                    options={anonymizerLabels}
                    onChange={changeLabelSelectHandler}
                  />

                  <Input
                    ref={inputLabelSufixRef}
                    placeholder="Sufijo"
                    onChange={changeLabelSufixHandler}
                    type="number"
                    min="1"
                  />

                  <Button
                    onClick={applyChanges}
                    disabled={!dialogState.selectedOption}
                  >
                    Aplicar
                  </Button>
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
