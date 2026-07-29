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
    full: {
      true: {},
      false: { px: { base: "4", sm: "6", md: "8", desktop: "12" } },
    },
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
        // Matches FileSelectionLayout's content width so screens built on
        // MainContent line up with the FileDropZone flow. Reading-column
        // rule A (tasks/responsive/plan.md) - `sizes.content.max`, 1824px -
        // rather than the crystallized 1015px Figma once specced at 1440px.
        maxWidth: "content.max",
        mx: "auto",
        pt: { base: "6", xl: "16" },
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
