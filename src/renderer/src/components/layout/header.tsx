import { css } from "@/styled/css";
import { Divider, Grid, Stack, styled } from "@/styled/jsx";

const header = css({
  width: "full",
  py: "6",
  px: "8",
  bg: "bg.secondary",
  borderBottom: "[1px solid #BCBAB8]",
});

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}
export default function Header({ title, children }: HeaderProps) {
  const img = title
    ? "/brand/aymurai-iso-darkpurple.svg"
    : "/brand/aymurai-hor-darkpurple.svg";

  return (
    <div className={header}>
      <Grid columns={3} gap="4" alignItems="center">
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
        <styled.div gridColumn="span 2">{children}</styled.div>
      </Grid>
    </div>
  );
}
