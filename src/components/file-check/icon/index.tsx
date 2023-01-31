import { CheckCircle, XCircle } from 'phosphor-react';
import Spinner from './Spinner';

import { colors } from 'styles/tokens';

interface Props {
  hasError: boolean;
  isLoading: boolean;
}
export default function Icon({ hasError, isLoading }: Props) {
  if (hasError) return <XCircle size={48} color={colors.errorPrimary} />;
  else if (isLoading) return <Spinner />;
  else return <CheckCircle size={48} color={colors.primary} />;
}
