import { css } from "@/styled/css";
import type { FeatureFlowEnum } from "@/types/features";
import { featureNamespace } from "@/types/features";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TutorialGrid,
} from "@aymurai/ui";
import { Question, X } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { buildTutorialSteps, tutorialGridOverride } from "./how-it-works";

interface HowItWorksModalProps {
  feature: FeatureFlowEnum;
  trigger?: ReactElement;
}

// G2 issue 03 (tasks/responsive-fixes/issues/G2-onboarding-grid-modal.md):
// `TutorialDialog` doesn't accept a `className` and renders its internal
// `TutorialGrid` without one, so `tutorialGridOverride` (how-it-works.tsx)
// can never reach the grid inside the modal - the dialog has to be
// recomposed from `@aymurai/ui`'s own pieces instead. The compiled
// `TutorialDialog` (dist/index.js) is EXACTLY this composition plus the
// `className` prop below - a 1:1 re-expression, not a redesign.
//
// Recorded deviation from the ticket's own prose: it points at
// `src/renderer/src/components/ui/dialog.tsx` ("nuestro wrapper de Radix") as
// the piece to compose with - that file does not exist (`.claude/rules/
// radix-ui.md` used to claim it did; corrected there too). Dialog/
// DialogContent/etc. below come straight from `@aymurai/ui`, which wraps
// `@radix-ui/react-dialog` itself - same Radix-backed accessibility G2's
// criterion 5 requires, via the library instead of a local wrapper. Adding a
// local `ui/dialog.tsx` on top would build a second Dialog implementation
// next to the one `@aymurai/ui` already ships, the exact duplication G2's own
// criterion 6 (one grid component in the import graph) argues against.
//
// Two classes the library applies internally to `DialogTitle`/`DialogClose`
// are NOT exported, so recomposing loses them unless reproduced here with
// their exact values (read from the bundle). Unlike `tutorialGridOverride`,
// these are plain `css()` - no `"&&"` - because the library's own class
// never lands on these two nodes in the FIRST place (there's no cascade
// tie to win here, unlike the grid root, where the library's rule DOES
// apply to the same node). Don't copy `"&&"` here, and don't remove it from
// `tutorialGridOverride` by symmetry - the two situations are different.
const dialogTitle = css({
  margin: "0",
  textStyle: "subtitle.md.strong",
});

const dialogClose = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.lighter",
  borderWidth: "0",
  bg: "[transparent]",
  cursor: "pointer",
  "&:hover": {
    color: "text.default",
  },
});

export default function HowItWorksModal({
  feature,
  trigger,
}: HowItWorksModalProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);
  const actualTrigger = trigger ?? (
    <button type="button" aria-label="Información sobre AymurAI">
      <Question size={32} />
    </button>
  );

  return (
    <Tooltip>
      <Dialog>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>{actualTrigger}</TooltipTrigger>
        </DialogTrigger>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className={dialogTitle}>{t("howItWorks")}</DialogTitle>
            <DialogClose className={dialogClose} aria-label={t("close")}>
              <X size={32} />
            </DialogClose>
          </DialogHeader>
          <TutorialGrid
            steps={buildTutorialSteps(tFeature)}
            className={tutorialGridOverride}
          />
        </DialogContent>
      </Dialog>
      <TooltipContent>{t("howItWorks")}</TooltipContent>
    </Tooltip>
  );
}
