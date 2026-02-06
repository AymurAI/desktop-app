import { css } from "@/styled/css";
import { stack } from "@/styled/patterns";

const background = css({
  display: "flex",

  bg: "bg.primary-highlight",
  height: "screen",
  width: "screen",

  p: "8",
});
const inner = css(
  stack.raw({ justify: "center", align: "center", gap: "12" }),
  {
    pos: "relative",

    bg: "bg.secondary",
    border: "primary",

    width: "full",
    height: "full",
  },
);

const builtBy = css({
  pos: "absolute",
  bottom: "16", // 64px
});

interface LoginLayoutProps {
  children?: React.ReactNode;
}
export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <main className={background}>
      <div className={inner}>
        {children}
        {/* Floating content below */}k
        <div className={builtBy}>
          <div className={stack({ gap: "2", align: "center" })}>
            <p
              className={css({
                textStyle: "label.sm.default",
                color: "text.lighter",
              })}
            >
              Plataforma hecha por
            </p>
            <img
              src="brand/datagenero.svg"
              alt="DataGenero isologo"
              width={150}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
