import { css, cx } from "@/styled/css";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { ArrowLeft } from "phosphor-react";

const link = css({
  cursor: "pointer",
});

interface BackButtonProps extends LinkComponentProps {}
export default function BackButton({ className, ...props }: BackButtonProps) {
  return (
    <Link className={cx(className, link)} {...props}>
      <ArrowLeft size={32} />
    </Link>
  );
}
