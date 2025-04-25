import { FC, HTMLAttributes, useState } from 'react';
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

type DialogOption = {
  id: string;
  label: string;
  action: () => void;
};

type DialogState = {
  open: boolean;
  title: string
  action: 'replace' | 'replaceAll'
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

  const handleAnnotationOperation = (
    operation: keyof typeof annotationOperations
  ) => {
    const annotationData = createAnnotationData(annotation as LabelAnnotation);
    if (!annotationData) return;

    annotationOperations[operation](annotationData);
  };

  const handleAddBySearch = (annotation: LabelAnnotation) => {
    if (!annotation?.tag) return;

    addBySearch(children, annotation.tag);
  };

  const changeLabelSelectHandler = (
    option: SelectOption | undefined,
    action: 'replace' | 'replaceAll'
  ) => {
    if (!option) return;

    const annotationData = createAnnotationData(annotation as LabelAnnotation);
    if (!annotationData) return;

    if (action === 'replace') {
      updateLabel(annotationData, option.id as AllLabels | AllLabelsWithSufix);
    } else if (action === 'replaceAll') {
      updateByText(annotationData, option.id as AllLabels | AllLabelsWithSufix);
    }
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

            {isAnnotable && annotation.type === 'search' ? (
              <S.ButtonContainer>
                <S.Button
                  type="search"
                  onClick={() => handleAddBySearch(annotation)}
                />
                <S.Button
                  type="searchSingle"
                  onClick={() => handleAnnotationOperation('add')}
                />
              </S.ButtonContainer>
            ) : annotation.tag ? (
              <S.ButtonContainer>
                <S.Button
                  type="replaceAll"
                  onClick={() => {
                    setDialogState({
                      open: true,
                      title: 'Reemplazar todas las ocurrencias',
                      action: 'replaceAll',
                    });
                  }}
                />
                <S.Button
                  type="replace"
                  onClick={() => {
                    setDialogState({
                      open: true,
                      title: 'Reemplazar esta ocurrencia',
                      action: 'replace',
                    });
                  }}
                />
                <S.Button
                  type="tagAll"
                  onClick={() => handleAnnotationOperation('removeByText')}
                />
                <S.Button
                  type="tag"
                  onClick={() => handleAnnotationOperation('remove')}
                />
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
              }))
            }
          >
            {(
              <>
                <DialogMessage>
                  Por favor, introduce la nueva etiqueta para reemplazar {dialogState.action === 'replace' ? 'esta ocurrencia' : 'todas las ocurrencias'} de {annotation.tag}.
                </DialogMessage>
                <DialogButtons>
                  <Select
                    placeholder="Seleccione una opción"
                    options={anonymizerLabels}
                    onChange={(option) =>
                      changeLabelSelectHandler(option, dialogState.action)
                    }
                  />
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
