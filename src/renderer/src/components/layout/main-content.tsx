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
        // Scoped version (tasks/responsive-fixes/plan-version-acotada.md):
        // back to the 1015px cap Figma specced at 1440px. The Responsive page
        // covers only the three validation screens, and none of them goes
        // through MainContent - verified: routes/app.$feature/validation.tsx
        // builds its own layout. So widening this would upscale onboarding,
        // preview, process and finish, which have no design at any width.
        maxWidth: "[1015px]",
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
