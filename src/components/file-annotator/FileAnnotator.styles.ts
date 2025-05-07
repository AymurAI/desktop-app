import { styled } from "styles";

export const Container = styled("div", {
  boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",

  zIndex: 1,
  overflowY: "scroll",
});

export const File = styled("div", {
  px: "$xl",
  pb: "$xl",

  "& p, & span, & em": {
    fontFamily: "$file",
    fontSize: 16,
    lineHeight: "100%",
    my: "1em",
  },
});

export const Paragraph = styled("p", {
  margin: "8px 0px",
});

export const ButtonContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  background: "#3f479d",
  borderRadius: "4px",
  padding: "2px",
  gap: "1px",
  visibility: "hidden",
  position: "absolute",
  top: "-20px",
  right: "-5px",
});

export const Button = styled("button", {
  background: "transparent",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.2s",

  "&:hover": {
    background: "rgba(0, 0, 0, 0.1)",
  },

  img: {
    width: "20px",
    height: "20px",
  },

  variants: {
    variant: {
      search: {},
      searchSingle: {},
      replaceAll: {},
      replace: {},
      tagAll: {},
      tag: {},
    },
  },
});

export const Mark = styled("mark", {
  position: "relative",
  overflowWrap: "break-word",
  padding: "0px  2px",
  borderRadius: 8,

  [`&:hover ${ButtonContainer}`]: {
    visibility: "visible",
  },

  variants: {
    type: {
      tag: {
        backgroundColor: "$primaryAlt",

        "& strong": {
          fontSize: "12px",
          padding: "0px",
          ml: "6px",
        },
      },
      search: {
        borderRadius: 0,
        fontWeight: 700,
        backgroundColor: "$bgSearch",
      },
    },
    annotable: {
      true: {
        cursor: "pointer",
      },
      false: {
        cursor: "default",
      },
    },
  },
  defaultVariants: {
    type: "tag",
    annotable: false,
  },
});

export const SearchContainer = styled("div", {
  p: "$l",

  zIndex: 1,
  top: 0,
  position: "sticky",
  background: "white",
});
