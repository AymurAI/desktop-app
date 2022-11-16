import { globalStyles } from 'styles';

import { Props } from './ThemeProvider.types';

export default function ThemeProvider({ children }: Props) {
  globalStyles();
  return <div className="theme-provider">{children}</div>;
}
