import FeatureRouter from "@/features/FeatureRouter";

import Anonymizer from "./anonymizer";
import Dataset from "./dataset";

export default function Finish() {
  return (
    <FeatureRouter
      DATA_SET={<Dataset/>}
      ANONYMIZER={<Anonymizer  />}
      VOICE_TO_TEXT={null}
    />
  );
}
