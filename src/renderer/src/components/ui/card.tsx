import { cva } from "@/styled/css";

const styles = cva({
  base: {
    transitionProperty: "[border, box-shadow]",
    transitionTimingFunction: "default",
    transitionDuration: "normal",
  },
  variants: {
    size: {
      lg: {
        p: "8",
        rounded: "sm",
      },
      sm: {
        rounded: "lg",
        p: "4",
      },
    },
    disabled: {
      true: {
        border: "primary",
        bg: "bg.primary",
        cursor: "not-allowed",
        color: "text.lighter",
      },
      false: {
        border: "primary",
        bg: "bg.secondary",
        cursor: "pointer",

        "&:hover": {
          border: "primary-alt",
          boxShadow: "[0px 0px 15px 0px #3F479D66]",
        },
      },
    },
  },
});

interface CardProps {
  children?: React.ReactNode;
  disabled?: boolean;
  size?: "lg" | "sm";
}
export default function Card({
  disabled = false,
  size = "lg",
  children,
}: CardProps) {
  const classes = styles({ size, disabled });
  return <div className={classes}>{children}</div>;
}
