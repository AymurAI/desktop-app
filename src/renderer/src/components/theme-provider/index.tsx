import type { Props } from "./ThemeProvider.types";

export default function ThemeProvider({ children }: Props) {
  return <div className="theme-provider">{children}</div>;
}
