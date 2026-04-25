import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";

const button = sva({
  slots: ["button", "tooltip_content"],
  base: {
    button: {
      p: "0.5",
      rounded: "[6px]",
      cursor: "pointer",
      _hover: {
        bg: "action.hover",
      },
    },
    tooltip_content: {
      bg: "action.hover",
      color: "white",
      px: "1",
      py: "0.5",
      rounded: "sm",
    },
  },
});

interface TaggerButtonProps {
  tooltip: string;
  children: React.ReactNode;
  onClick: () => void;
}
export default function TaggerButton({
  children,
  tooltip,
  onClick,
}: TaggerButtonProps) {
  const classes = button();
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onClick} className={classes.button}>
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent showArrow={false} sideOffset={12}>
          <div className={classes.tooltip_content}>
            <styled.p textStyle="label.sm.default">{tooltip}</styled.p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
