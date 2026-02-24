import { styled } from "@/styles";
import { Link } from "@tanstack/react-router";

export const Background = styled("main", {
  bg: "$secondary",

  display: "flex",

  height: "100vh",
  width: "100vw",

  p: 32,
});

export const InnerBackground = styled("div", {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 48,

  position: "relative",

  bg: "$white",
  b: "1px solid $borderPrimary",

  width: "100%",
  height: "100%",
});

export const BackButton = styled(Link, {
  position: "absolute",

  top: "$m",
  left: "$m",
});

export const BuiltBy = styled("div", {
  position: "absolute",
  bottom: "$xxl",
});
