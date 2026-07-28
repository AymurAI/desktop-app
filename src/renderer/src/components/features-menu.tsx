import { FEATURE_ICON } from "@/constants/config";
import { useFileDispatch } from "@/hooks/useFiles";
import { removeAllFiles } from "@/reducers/file/actions";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import {
  Button,
  FeaturesMenu as FeaturesMenuGrid,
  FeaturesMenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { Article, DotsNine, Gear } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

interface FeaturesMenuProps {
  trigger?: ReactElement;
}

export default function FeaturesMenu({ trigger }: FeaturesMenuProps) {
  const { t } = useTranslation();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const features = Object.values(FeatureFlowEnum);

  const handleClearFiles = () => {
    dispatch(removeAllFiles());
  };

  const goToFeature = (feature: FeatureFlowEnum) => {
    handleClearFiles();
    navigate({ to: "/app/$feature", params: { feature } });
  };

  const goToSettings = () => {
    handleClearFiles();
    navigate({ to: "/home/host" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            size="icon-sm"
            style={{ padding: 2 }}
            aria-label="Ir al inicio"
          >
            <DotsNine size={32} />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" surface={false}>
        <FeaturesMenuGrid>
          {features.map((feature) => {
            const Icon = FEATURE_ICON[feature];
            return (
              <FeaturesMenuItem
                key={feature}
                icon={<Icon size={24} />}
                label={t("title", { ns: featureNamespace[feature] })}
                onClick={() => goToFeature(feature)}
              />
            );
          })}
          <FeaturesMenuItem
            icon={<Article size={24} />}
            label={t("featuresMenu.summary")}
            disabled
          />
          <FeaturesMenuItem
            icon={<Gear size={24} />}
            label={t("settings")}
            fullWidth
            onClick={goToSettings}
          />
        </FeaturesMenuGrid>
      </PopoverContent>
    </Popover>
  );
}
