import { FEATURES } from "@/constants";
import { Grid, Stack, styled } from "@/styled/jsx";
import type { FeatureFlowEnum } from "@/types/features";
import { Link } from "@tanstack/react-router";
import { DotsNine } from "phosphor-react";
import FeatureIcon from "./feature-icon";
import Button from "./ui/button";
import Card from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function FeaturesMenu() {
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
