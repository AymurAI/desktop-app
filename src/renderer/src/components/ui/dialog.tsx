import { css, cx } from "@/styled/css";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

const overlayStyles = css({
  position: "fixed",
  inset: "[0]",
  zIndex: 50,
  bg: "[rgba(0, 0, 0, 0.5)]",

  "&[data-state='open']": {
    animation: "fadeIn",
  },
  "&[data-state='closed']": {
    animation: "fadeOut",
  },
});

const contentStyles = css({
  position: "fixed",
  inset: "[0]",
  margin: "auto",
  zIndex: 50,

  bg: "bg.secondary",
  rounded: "lg",
  p: "6",
  boxShadow: "[0px 0px 15px 0px #00000026]",

  width: "[90vw]",
  h: "[fit-content]",

  "&[data-state='open']": {
    animation: "fadeIn",
  },
  "&[data-state='closed']": {
    animation: "fadeOut",
  },
});

function DialogOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cx(overlayStyles, className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  container,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  container?: HTMLElement;
}) {
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cx(contentStyles, className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};
