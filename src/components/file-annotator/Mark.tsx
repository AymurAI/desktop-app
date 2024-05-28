import { FC, HTMLAttributes } from 'react';

import { useAnnotation } from 'context/Annotation';
import { Annotation, LabelAnnotation, Metadata } from './types';
import * as S from './FileAnnotator.styles';

interface MarkProps extends HTMLAttributes<HTMLSpanElement> {
  annotation: Annotation;
  children: string;
}
export const Mark: FC<MarkProps> = ({ children, annotation, ...props }) => {
  const { add, remove, isAnnotable } = useAnnotation();

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

  const clickHandler = () => {
    const fn = annotation.type === 'search' ? add : remove;

    const { start, end, tag, paragraphId } = annotation as LabelAnnotation;

    if (tag) {
      fn({
        start_char: start,
        end_char: end,
        attrs: {
          aymurai_label: tag,
          aymurai_label_subclass: null,
          aymurai_alt_text: null,
        },
        paragraphId: paragraphId,
        text: children,
      });
    }
  };

  switch (annotation.type) {
    case 'tag':
    case 'search':
      return (
        <S.Mark
          type={annotation.type}
          annotable={Boolean(false)}
          className={`${annotation.type}`}
          {...props}
          {...metadata}
        >
          {/* Added double space to better denote the separation between words.*/}
          {children.replaceAll(' ', '\u00a0\u00a0')}

          {annotation.type === 'tag' && <strong>{annotation.tag}</strong>}
          {isAnnotable && annotation.tag && (
            <S.Button type={annotation.type} onClick={clickHandler} />
          )}
        </S.Mark>
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
