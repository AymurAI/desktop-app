import { FC, HTMLAttributes, PropsWithChildren } from 'react';

import { Annotation, Metadata } from './types';
import * as S from './FileAnnotator.styles';

interface MarkProps extends PropsWithChildren, HTMLAttributes<HTMLSpanElement> {
  annotation: Annotation;
  // TODO: add support for adding/removing annotations
  // annotate?: AnnotateHandlers;
}
export const Mark: FC<MarkProps> = ({ children, annotation }) => {
  let metadata: Metadata = {
    'data-start': annotation.start,
    'data-end': annotation.end,
  };

  if (annotation.type !== 'text') {
    metadata = {
      ...metadata,
      'data-paragraphid': annotation.paragraphId,
      'data-tag': annotation.tag,
    };
  }

  // const fn = annotation.type === 'search' ? annotate.add : annotate.remove;

  switch (annotation.type) {
    case 'tag':
    case 'search':
      return (
        <S.Mark type={annotation.type} annotable={Boolean(false)}>
          {children}

          {annotation.type === 'tag' && <strong>{annotation.tag}</strong>}
          {/* {annotate && <S.Button onClick={fn}/>} */}
        </S.Mark>
      );
    case 'text':
    default:
      return <span {...metadata}>{children}</span>;
  }
};
