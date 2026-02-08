import { FEATURES } from "@/constants";
import { css } from "@/styled/css";
import { Divider, Grid, Stack, styled } from "@/styled/jsx";
import type { FeatureFlowEnum } from "@/types/features";
import { Link } from "@tanstack/react-router";
import { DotsNine } from "phosphor-react";
import FeatureIcon from "../feature-icon";
import Button from "../ui/button";
import Card from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

function Menu() {
  const features = Object.entries(FEATURES);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon-sm" style={{ padding: 2 }}>
          <DotsNine size={32} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Grid columns={2} padding="4">
          {features.map(([value, feature]) => (
            <Link
              key={value}
              to="/app/$feature"
              params={{ feature: value as FeatureFlowEnum }}
            >
              <Card size="sm">
                <Stack gap="3" align="center">
                  <FeatureIcon feature={value as FeatureFlowEnum} size="sm" />
                  <styled.p textStyle="label.md.strong">
                    {feature.title}
                  </styled.p>
                </Stack>
              </Card>
            </Link>
          ))}
        </Grid>
      </PopoverContent>
    </Popover>
  );
}

const header = css({
  width: "full",
  py: "6",
  px: "8",
  bg: "bg.secondary",
  borderBottom: "[1px solid #BCBAB8]",
});

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  withFeaturesMenu?: boolean;
}
export default function Header({
  title,
  withFeaturesMenu,
  children,
}: HeaderProps) {
  const img = title
    ? "brand/aymurai-iso-darkpurple.svg"
    : "brand/aymurai-hor-darkpurple.svg";

  return (
    <div className={header}>
      <Grid columns={3} gap="4" alignItems="center">
        <Stack gap="4" align="center" direction="row">
          <img width={200} src={img} alt="AymurAI logo" />
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
        <styled.div gridColumn="span 2">
          {children}
          {withFeaturesMenu && <Menu />}
        </styled.div>
      </Grid>
    </div>
  );
}
