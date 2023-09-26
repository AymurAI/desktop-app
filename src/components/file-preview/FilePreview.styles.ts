import { styled } from "styles";

export const Wrapper = styled("div", {
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  justifyContent: "start",
  alignItems: "center",
  gap: "$s",

  position: "relative",

  // Settings to enable ellipsis on file name
  maxWidth: 150,
  "& p": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
});

export const FileContainer = styled("div", {
  height: 200,
  width: 150,
  p: "$xs",

  boxShadow: "0px 0px $sizes$xs rgba(0, 0, 0, 0.1)",
  borderRadius: "$s",
  b: "$sizes$xs solid $borderPrimary",

  "& p, & span, & strong, & em": {
    fontFamily: "$file",
    fontSize: 8,
    lineHeight: "100%",
    my: "1em",
  },

  // Only shows text that fits into the box
  overflow: "hidden",
});
