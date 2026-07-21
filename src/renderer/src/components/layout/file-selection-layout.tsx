import BackButton from "@/components/ui/back-button";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack } from "@/styled/jsx";
import type { ReactNode } from "react";

const viewport = css({
  minH: "full",
  width: "full",
  px: { base: "4", sm: "6", md: "8" },
  pt: { base: "6", xl: "16" },
});

const content = css({
  width: "full",
  maxWidth: "[1015px]",
  mx: "auto",
});

interface FileSelectionLayoutProps {
  title: ReactNode;
  children: ReactNode;
}

export default function FileSelectionLayout({
  title,
  children,
}: FileSelectionLayoutProps) {
  return (
    <div className={viewport}>
      <Stack gap="8" className={content}>
        <HStack alignItems="center" gap="6">
          <BackButton to="/home/features" />
          <SectionTitle>{title}</SectionTitle>
        </HStack>
        {children}
      </Stack>
    </div>
  );
}
