import { WHITELISTED_EXTENSIONS } from "@/constants/config";
import { css, cx } from "@/styled/css";
import type { ComponentProps } from "react";

const input = css({
  display: "none",
  visibility: "hidden",
  opacity: 0,
  pointerEvents: "none",
});

interface HiddenInputProps extends Omit<ComponentProps<"input">, "onChange"> {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  /**
   * Optional whitelist override, e.g. audio-only extensions for the
   * voice-to-text flow. Defaults to {@link WHITELISTED_EXTENSIONS}.
   */
  extensions?: string[];
}
export default function HiddenInput({
  className,
  extensions = WHITELISTED_EXTENSIONS,
  ...props
}: HiddenInputProps) {
  const accept = extensions.map((ext) => `.${ext}`).join(",");
  return (
    <input
      type="file"
      accept={accept}
      tabIndex={-1}
      className={cx(input, className)}
      {...props}
    />
  );
}
