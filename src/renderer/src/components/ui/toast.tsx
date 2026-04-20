import { type Toast as HotToast, toast } from "react-hot-toast";
import type { Icon } from "phosphor-react";
import Callout, { type CalloutVariant } from "./callout";

export type ToastVariant = CalloutVariant;

interface ToastProps {
  t: HotToast;
  message: string;
  variant?: ToastVariant;
  icon?: Icon;
}

const ASSERTIVE_VARIANTS: ToastVariant[] = ["error", "warning"];

function Toast({ t, message, variant = "info", icon }: ToastProps) {
  const isAssertive = ASSERTIVE_VARIANTS.includes(variant);

  return (
    <Callout
      message={message}
      variant={variant}
      icon={icon}
      onDismiss={() => toast.dismiss(t.id)}
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      aria-atomic="true"
    />
  );
}

export default Toast;
