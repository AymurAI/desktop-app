import { styled } from 'styles';

export const Legend = styled('legend', {
  fontWeight: '$strong',
  fontSize: '$subtitleMd',
  lineHeight: '$subtitleMd',
  color: '$textDefault',

  mb: '$l',
});

export const Fieldset = styled('fieldset', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$l',
});
