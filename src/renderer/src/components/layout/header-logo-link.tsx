import { css } from "@/styled/css";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const logoLink = css({
  display: "inline-flex",
  borderRadius: "sm",
  transitionProperty: "[opacity,transform]",
  transitionDuration: "[160ms]",
  _hover: {
    opacity: "0.8",
    transform: "scale(1.04)",
  },
  _focusVisible: {
    outline: "[2px solid]",
    outlineColor: "action.focus",
    outlineOffset: "[3px]",
  },
});

interface HeaderLogoLinkProps {
  children: ReactNode;
}

export default function HeaderLogoLink({ children }: HeaderLogoLinkProps) {
  const { t } = useTranslation("common");

  return (
    <Link
      to="/home/features"
      aria-label={t("header.homeAria")}
      className={logoLink}
    >
      {children}
    </Link>
  );
}
