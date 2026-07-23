import { css } from "@/styled/css";
import { styled } from "@/styled/jsx";
import {
  ToolButton,
  type ToolButtonAction,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@aymurai/ui";

const tooltipContent = css({
  bg: "action.hover",
  color: "white",
  px: "1",
  py: "0.5",
  rounded: "sm",
});

// ToolButton's default disabled state dims its background (action.disabled).
// This toolbar wants disabled actions to keep their regular color and only
// signal disablement via the not-allowed cursor, matching the prior
// hand-rolled TaggerButton's affordance.
const keepColorWhenDisabled = css({
  "&:disabled": {
    bg: "action.alt-default",
  },
});

interface TaggerButtonProps {
  action: ToolButtonAction;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}
export default function TaggerButton({
  action,
  tooltip,
  onClick,
  disabled = false,
}: TaggerButtonProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolButton
            action={action}
            aria-label={tooltip}
            title={tooltip}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-disabled={disabled}
            className={keepColorWhenDisabled}
          />
        </TooltipTrigger>
        <TooltipContent showArrow={false} sideOffset={12}>
          <div className={tooltipContent}>
            <styled.p textStyle="label.sm.default">{tooltip}</styled.p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
