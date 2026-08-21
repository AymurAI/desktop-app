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

// Scoped version (tasks/responsive-fixes/plan-version-acotada.md): back to the
// 1015px cap. Only onboarding, preview and voice-to-text/onboarding consume
// this layout, and the Figma Responsive page covers none of them.
const content = css({
  width: "full",
  maxWidth: "[1015px]",
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
