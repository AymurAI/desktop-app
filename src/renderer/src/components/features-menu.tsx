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
import { DotsNine, Gear } from "phosphor-react";
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

  // Navigate before clearing files, and skip the view transition: RequireFile
  // redirects to onboarding the moment files.length hits 0. Clearing first
  // let that race the intended navigation outright; awaiting `navigate()`
  // alone isn't enough either, because with the router's default view
  // transition on, the actual route/match swap runs inside
  // `document.startViewTransition()`, which resolves *after* `navigate()`'s
  // own promise — so the old, still-mounted route could still see the
  // cleared files and fire its guard. `viewTransition: false` makes this
  // specific navigation commit synchronously, closing that gap.
  //
  // Target onboarding directly (not `/app/$feature`, whose own `beforeLoad`
  // redirects there): a `redirect()` thrown from `beforeLoad` starts a new
  // commit that doesn't inherit this call's `viewTransition: false`, which
  // would reopen the exact gap this fix closes.
  const goToFeature = async (feature: FeatureFlowEnum) => {
    await navigate({
      to: "/app/$feature/onboarding",
      params: { feature },
      viewTransition: false,
    });
    handleClearFiles();
  };

  const goToSettings = async () => {
    await navigate({ to: "/home/host", viewTransition: false });
    handleClearFiles();
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
            const label =
              feature === FeatureFlowEnum.Summarizer
                ? t("featuresMenu.summary")
                : t("title", { ns: featureNamespace[feature] });
            return (
              <FeaturesMenuItem
                key={feature}
                icon={<Icon size={24} />}
                label={label}
                onClick={() => goToFeature(feature)}
              />
            );
          })}
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
