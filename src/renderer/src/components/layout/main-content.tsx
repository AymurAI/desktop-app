import { cva, cx } from "@/styled/css";
import { stack } from "@/styled/patterns";

const content = cva({
  base: {
    flex: "1",
    minH: "0",

    width: "full",
    overflowY: "auto",

    bg: "bg.primary",
  },
  variants: {
    full: { true: {}, false: {} },
  },
  defaultVariants: {
    full: false,
  },
});

const inner = cva({
  base: {
    width: "full",
    minH: "full",
  },
  variants: {
    full: {
      true: {},
      false: {
        ...stack.raw({ gap: "0" }),
        maxWidth: "5xl",
        mx: "auto",
        pt: { base: "6", xl: "16" },
        px: "8",
      },
    },
  },
  defaultVariants: { full: false },
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
    <main className={cx(content({ full }))}>
      <div className={inner({ full })}>{children}</div>
    </main>
  );
}
