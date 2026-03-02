import { Grid, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Link } from "@tanstack/react-router";
import { DotsNine } from "phosphor-react";
import { useTranslation } from "react-i18next";
import FeatureIcon from "./feature-icon";
import Button from "./ui/button";
import Card from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function FeaturesMenu() {
  const { t } = useTranslation();
  const features = Object.values(FeatureFlowEnum);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon-sm" style={{ padding: 2 }}>
          <DotsNine size={32} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Grid columns={2} padding="4">
          {features.map((feature) => (
            <Link key={feature} to="/app/$feature" params={{ feature }}>
              <Card size="sm" clickable>
                <Stack gap="3" align="center">
                  <FeatureIcon feature={feature} size="sm" />
                  <styled.p textStyle="label.md.strong">
                    {t("title", { ns: featureNamespace[feature] })}
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
