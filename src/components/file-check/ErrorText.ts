import { Subtitle } from 'components';
import { styled } from 'styles';

const ErrorText = styled(Subtitle, {
  fontStyle: 'italic',
  color: '$errorPrimary',
  textAlign: 'center',
});

export default ErrorText;
