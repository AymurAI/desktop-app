import { forwardRef } from "react";

import { WHITELISTED_EXTENSIONS } from "@/constants/config";
import type { CSS } from "@/styles";
import type { NativeComponent } from "@/types/component";
import Input from "./HiddenInput.styles";

interface Props extends NativeComponent<"input"> {
  css?: CSS;
}

export default forwardRef<HTMLInputElement, Props>(function HiddenInput(
  { multiple = true, ...props },
  ref,
) {
  // Convert the array into a '.dcox' form
  const extensions = WHITELISTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

  return (
    <Input
      type="file"
      accept={extensions}
      multiple={multiple}
      tabIndex={-1}
      {...props}
      ref={ref}
    />
  );
});
