import { styled } from "@/styled/jsx";

const Suggestion = styled("mark", {
  base: {
    bg: "bg.primary-alternative",
    textStyle: "label.md.default",
  },
  variants: {
    clickable: {
      true: { cursor: "pointer" },
      false: { cursor: "unset" },
    },
  },
  defaultVariants: {
    clickable: false,
  },
});

export default Suggestion;
