import { useTutorialSeen } from "@/store/useLocal";
import { css } from "@/styled/css";
import { Divider, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import FeaturesMenu from "../features-menu";
import HowItWorksModal from "../how-it-works-modal";
import VoiceHowItWorksModal from "../voice-to-text/how-it-works";

const header = css({
  position: "relative",
  width: "full",
  height: "24",
  py: "6",
  px: "12",
  bg: "bg.secondary",
  borderBottom: "[1px solid #BCBAB8]",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const centerSlot = css({
  position: "absolute",
  left: "[50%]",
  transform: "translateX(-50%)",
});

type HeaderProps = {
  title?: string;
  center?: React.ReactNode;
} & (
  | { feature: FeatureFlowEnum; right?: never }
  | { right: React.ReactNode; feature?: never }
  | { right?: never; feature?: never }
);

export default function Header({ title, center, feature, right }: HeaderProps) {
  const tutorialSeen = useTutorialSeen(feature!);

  const img = title
    ? "/brand/aymurai-iso-darkpurple.svg"
    : "/brand/aymurai-hor-darkpurple.svg";

  const rightSlot = feature ? (
    <HStack>
      {feature === FeatureFlowEnum.VoiceToText ? (
        <VoiceHowItWorksModal />
      ) : (
        tutorialSeen && <HowItWorksModal feature={feature} />
      )}
      <FeaturesMenu />
    </HStack>
  ) : (
    right
  );

  return (
    <header className={header}>
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
      {center && <div className={centerSlot}>{center}</div>}
      {rightSlot}
    </header>
  );
}
