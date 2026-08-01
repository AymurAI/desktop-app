import { AppFooter, type AppFooterProps } from "@aymurai/ui";
import { type ReactNode, useId, useLayoutEffect } from "react";
import BuiltBy from "../brand/built-by";

export const FOOTER_TOAST_OFFSET_VAR = "--app-footer-toast-offset";

const footerToastOffsets = new Map<string, number>();

function updateDocumentFooterToastOffset() {
  const maxOffset = Math.max(0, ...footerToastOffsets.values());

  if (maxOffset === 0 && footerToastOffsets.size === 0) {
    document.documentElement.style.removeProperty(FOOTER_TOAST_OFFSET_VAR);
    return;
  }

  document.documentElement.style.setProperty(
    FOOTER_TOAST_OFFSET_VAR,
    `${maxOffset}px`,
  );
}

interface FooterProps extends Omit<AppFooterProps, "actions" | "leading"> {
  withBuiltBy?: boolean;
  children?: ReactNode;
}

export default function Footer({
  withBuiltBy,
  children,
  ...props
}: FooterProps) {
  const footerInstanceId = useId();

  useLayoutEffect(() => {
    const footer = document.querySelector<HTMLDivElement>(
      `[data-footer-toast-offset-source="${footerInstanceId}"]`,
    );

    if (!footer) {
      return;
    }

    const updateFooterOffset = () => {
      footerToastOffsets.set(
        footerInstanceId,
        footer.getBoundingClientRect().height,
      );
      updateDocumentFooterToastOffset();
    };

    updateFooterOffset();

    if (typeof window.ResizeObserver === "undefined") {
      return () => {
        footerToastOffsets.delete(footerInstanceId);
        updateDocumentFooterToastOffset();
      };
    }

    const resizeObserver = new window.ResizeObserver(updateFooterOffset);
    resizeObserver.observe(footer);

    return () => {
      resizeObserver.disconnect();
      footerToastOffsets.delete(footerInstanceId);
      updateDocumentFooterToastOffset();
    };
  }, [footerInstanceId]);

  return (
    <AppFooter
      {...props}
      data-footer-toast-offset-source={footerInstanceId}
      leading={withBuiltBy ? <BuiltBy size={120} gap="0" /> : undefined}
      actions={children}
    />
  );
}
