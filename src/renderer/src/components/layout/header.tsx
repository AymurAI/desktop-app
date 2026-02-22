import { css } from "@/styled/css";
import { Divider, Stack, styled } from "@/styled/jsx";

const header = css({
  position: "relative",
  width: "full",
  height: "24",
  py: "6",
  px: "12",
  bg: "bg.secondary",
  borderBottom: "[1px solid #BCBAB8]",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const centerSlot = css({
  position: "absolute",
  left: "[50%]",
  transform: "translateX(-50%)",
});

interface HeaderProps {
  title?: string;
  center?: React.ReactNode;
  right?: React.ReactNode;
}
export default function Header({ title, center, right }: HeaderProps) {
  const img = title
    ? "/brand/aymurai-iso-darkpurple.svg"
    : "/brand/aymurai-hor-darkpurple.svg";

  return (
    <header className={header}>
      <Stack gap="4" align="center" direction="row">
        <img height={40} src={img} alt="AymurAI logo" />
        {title && (
          <>
            <Divider
              orientation="vertical"
              thickness="[2px]"
              color="text.default"
              height="4"
            />
            <styled.span textStyle="subtitle.md.strong">{title}</styled.span>
          </>
        )}
      </Stack>
      {center && <div className={centerSlot}>{center}</div>}
      <div>{right}</div>
    </header>
  );
}
