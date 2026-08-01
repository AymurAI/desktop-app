import type { CSSProperties } from "react";
import { Toaster } from "react-hot-toast";
import { FOOTER_TOAST_OFFSET_VAR } from "./footer";

const toasterContainerStyle = {
  // `Footer` publishes its measured height only while it is mounted. Routes
  // without a footer keep react-hot-toast's original 16px bottom inset.
  bottom: `calc(var(${FOOTER_TOAST_OFFSET_VAR}, 0px) + 16px)`,
} satisfies CSSProperties;

export default function AppToaster() {
  return (
    <Toaster position="bottom-center" containerStyle={toasterContainerStyle} />
  );
}
