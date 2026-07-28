import { css } from "@/styled/css";

export const container = css({
  flex: "1",
  minW: "0",
  minH: "0",
  zIndex: "1",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const file = css({
  flex: "1",
  minH: "0",
  minW: "0",
  overflowY: "auto",
  overflowX: "hidden",
  px: "8",
  pb: "8",

  "& p, & span, & em": {
    fontFamily: "file",
    fontSize: "[16px]",
    lineHeight: "[160%]",
  },
});

export const paragraph = css({
  my: "2",
});
