import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { css } from "@/styled/css";
import { Stack, styled } from "@/styled/jsx";
import Header from "./header";
import MainContent from "./main-content";
import ReadingColumn from "./reading-column";

const viewport = css({
  width: "full",
  minH: "full",
  display: "flex",
  alignItems: "center",
  py: { base: "12", desktop: "20" },
});

const banner = css({
  width: "full",
  minWidth: "0",
  overflowX: "hidden",
});

const content = css({
  width: "full",
  display: "flex",
  flexDir: "column",
  alignItems: "flex-start",
  gap: "4",
});

const homeLink = css({
  display: "inline-flex",
  alignItems: "center",
  textStyle: "cta.md.strong",
  color: "text.default",
  textDecoration: "underline",
  textUnderlineOffset: "[4px]",
  mt: "4",
  _hover: {
    color: "brand.primary",
  },
  _focusVisible: {
    outline: "[2px solid]",
    outlineColor: "action.focus",
    outlineOffset: "[3px]",
    rounded: "sm",
  },
});

export default function NotFound() {
  const { t } = useTranslation("common");

  return (
    <Stack width="full" height="[100dvh]" gap="0">
      <header className={banner}>
        <Header />
      </header>
      <MainContent full>
        <div className={viewport}>
          <ReadingColumn variant="full">
            <section className={content}>
              <styled.h1 textStyle="title.md.strong" color="text.default">
                {t("notFound.title")}
              </styled.h1>
              <styled.p textStyle="paragraph.md.default" color="text.lighter">
                {t("notFound.description")}
              </styled.p>
              <Link to="/home/features" className={homeLink}>
                {t("notFound.linkLabel")}
              </Link>
            </section>
          </ReadingColumn>
        </div>
      </MainContent>
    </Stack>
  );
}
