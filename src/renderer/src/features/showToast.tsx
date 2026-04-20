import Toast, { type ToastVariant } from "@/components/ui/toast";
import { toast } from "react-hot-toast";

export function showToast(message: string, variant: ToastVariant = "info") {
  toast.custom((t) => <Toast t={t} message={message} variant={variant} />);
}
