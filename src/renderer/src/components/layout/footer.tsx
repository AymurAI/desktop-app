import { AppFooter } from "@aymurai/ui";
import BuiltBy from "../brand/built-by";

interface FooterProps {
  withBuiltBy?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export default function Footer({
  withBuiltBy,
  children,
  className,
}: FooterProps) {
  return (
    <AppFooter
      className={className}
      leading={withBuiltBy ? <BuiltBy size={120} gap="0" /> : undefined}
      actions={children}
    />
  );
}
