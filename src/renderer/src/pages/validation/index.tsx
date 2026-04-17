import FeatureRouter from "@/features/FeatureRouter";
import Anonymizer from "./anonymizer";
import Dataset from "./dataset";
import VoiceValidation from "./voice";

export default function Validation() {
  return (
    <FeatureRouter
      DATA_SET={<Dataset/>}
      ANONYMIZER={<Anonymizer  />}
      VOICE_TO_TEXT={<VoiceValidation />}
    />
  );
}
