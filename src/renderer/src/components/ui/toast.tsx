import { cva, cx } from "@/styled/css";
import { Bell, X } from "phosphor-react";
import { type Toast as HotToast, toast } from "react-hot-toast";

const toastRecipe = cva({
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

export type ToastVariant = "error" | "warning" | "success" | "info";

interface ToastProps {
  t: HotToast;
  message: string;
  variant?: ToastVariant;
}

function Toast({ t, message, variant = "info" }: ToastProps) {
  return (
    <div className={cx(toastRecipe({ variant }))}>
      <Bell size={20} weight="light" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button type="button" onClick={() => toast.dismiss(t.id)}>
        <X size={18} />
      </button>
    </div>
  );
}


export default Toast;
