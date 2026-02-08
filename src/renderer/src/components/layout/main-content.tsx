import { cva } from "@/styled/css";

const content = cva({
  base: {
    flex: "1",

    width: "full",
    height: "full",

    bg: "bg.primary",
  },
  variants: {
    full: {
      true: {},
      false: {
        display: "flex",
        flexDir: "column",
        alignItems: "center",
        pt: "28",

        "& > div.spacing": {
          width: "5xl",
          mx: "8",
        },
      },
    },
  },
  defaultVariants: {
    full: false,
  },
});

interface MainContentProps {
  children: React.ReactNode;
  full?: boolean;
}
export default function MainContent({
  children,
  full = false,
}: MainContentProps) {
  return (
    <main className={content({ full })}>
      <div className="spacing">{children}</div>
    </main>
  );
}
