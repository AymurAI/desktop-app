import { Feature } from "@/types/features";
import { useParams } from "react-router-dom";

interface ComponentsProps {
  [Feature.Dataset]: JSX.Element;
  [Feature.Anonymizer]: JSX.Element;
  [Feature.VoiceToText]: JSX.Element | null;
}

export default function FeatureRouter(
  components: ComponentsProps,
): JSX.Element | null {
  const { feature } = useParams<{ feature: Feature }>();
  if (!feature) return null;

  return components[feature] ?? null;
}
