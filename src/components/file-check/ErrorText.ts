import { styled } from 'styles';

const ErrorText = styled('p', {
  fontStyle: 'italic',
  color: '$errorPrimary',
  textAlign: 'center',
  fontSize: '$subtitleMd',
  lineHeight: '$subtitleMd',
  fontWeight: '$default',
});

export default ErrorText;
