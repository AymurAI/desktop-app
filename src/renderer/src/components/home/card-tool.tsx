import { cx, sva } from "@/styled/css";
import { Stack, styled } from "@/styled/jsx";
import { stack } from "@/styled/patterns";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { Icon } from "phosphor-react";

const card = sva({
  className: "card-tool",
  slots: ["container", "icon"],
  base: {
    container: {
      ...stack.raw({ gap: "4", align: "start" }),
      padding: "8",
      rounded: "sm",

      transitionProperty: "[border, box-shadow]",
      transitionTimingFunction: "default",
      transitionDuration: "normal",
    },
    icon: {
      p: "4",
      borderRadius: "[14px]",
    },
  },
  variants: {
    disabled: {
      true: {
        container: {
          border: "primary",
          bg: "bg.primary",
          cursor: "not-allowed",
          color: "text.lighter",
        },
        icon: {
          bg: "bg.secondary",
        },
      },
      false: {
        container: {
          border: "primary",
          bg: "bg.secondary",
          cursor: "pointer",

          "&:hover": {
            border: "primary-alt",
            boxShadow: "[0px 0px 15px 0px #3F479D66]",
          },
        },
        icon: {
          bg: "bg.primary-alternative",
        },
      },
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

interface CardToolProps extends LinkComponentProps {
  title: string;
  subtitle: string;
  icon: Icon;
  disabled?: boolean;
}
export default function CardTool({
  title,
  subtitle,
  icon: Icon,
  disabled = false,
  className,
  ...props
}: CardToolProps) {
  const classes = card({ disabled });
  return (
    <Link
      className={cx(className, classes.container)}
      disabled={disabled}
      {...props}
    >
      <div className={classes.icon}>
        <Icon size={42} />
      </div>
      <Stack gap="1">
        <styled.h2 textStyle="subtitle.md.strong">{title}</styled.h2>
        <styled.p textStyle="subtitle.sm.default" color="text.lighter">
          {subtitle}
        </styled.p>
      </Stack>
    </Link>
  );
}
