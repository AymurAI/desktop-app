import { cva, cx } from "@/styled/css";
import { Bell, X } from "phosphor-react";
import type { HTMLAttributes } from "react";

const calloutRecipe = cva({
  base: {
    display: "flex",
    flexDir: "row",
    alignItems: "center",
    gap: "3",
    px: "4",
    py: "3",
    rounded: "lg",
    borderWidth: "[1px]",
    borderStyle: "solid",
    width: "[360px]",
    textStyle: "paragraph.sm.default",
    color: "text.default",
  },
  variants: {
    variant: {
      error: {
        bg: "system.error-secondary",
        borderColor: "system.error",
      },
      warning: {
        bg: "system.warning-secondary",
        borderColor: "system.warning",
      },
      success: {
        bg: "system.success-secondary",
        borderColor: "system.success",
      },
      info: {
        bg: "system.info-secondary",
        borderColor: "[#BCBAB8]",
      },
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export type CalloutVariant = "error" | "warning" | "success" | "info";

interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  variant?: CalloutVariant;
  onDismiss?: () => void;
}

function Callout({ message, variant = "info", onDismiss, className, ...props }: CalloutProps) {
  return (
    <div className={cx(calloutRecipe({ variant }), className)} {...props}>
      <Bell size={20} weight="light" aria-hidden="true" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button type="button" aria-label="Dismiss notification" onClick={onDismiss}>
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default Callout;
