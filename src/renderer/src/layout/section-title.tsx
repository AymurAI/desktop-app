import { styled } from "@/styled/jsx";

interface SectionTitleProps {
  children: React.ReactNode;
}
export function SectionTitle({ children }: SectionTitleProps) {
  return <styled.h1 textStyle="title.md.strong">{children}</styled.h1>;
}
