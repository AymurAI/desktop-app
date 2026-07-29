import BackButton from "@/components/ui/back-button";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack } from "@/styled/jsx";
import type { ReactNode } from "react";

const viewport = css({
  minH: "full",
  width: "full",
  px: { base: "4", sm: "6", md: "8", desktop: "12" },
  pt: { base: "6", xl: "16" },
});

// Reading-column rule A (tasks/responsive/plan.md) - `sizes.content.max`,
// 1824px - rather than the crystallized 1015px Figma once specced at 1440px.
const content = css({
  width: "full",
  maxWidth: "content.max",
  mx: "auto",
});

interface FileSelectionLayoutProps {
  title: ReactNode;
  children: ReactNode;
  backButton?: ReactNode;
}

export default function FileSelectionLayout({
  title,
  children,
  backButton,
}: FileSelectionLayoutProps) {
  return (
    <div className={viewport}>
      <Stack gap="8" className={content}>
        <HStack alignItems="center" gap="6">
          {backButton ?? <BackButton to="/home/features" />}
          <SectionTitle>{title}</SectionTitle>
        </HStack>
        {children}
      </Stack>
    </div>
  );
}
