import anonymizer from "./anonymizer";
import common from "./common";
import dataset from "./dataset";
import recomendaciones from "./recomendaciones";
import voiceToText from "./voice-to-text";

const es = {
  common,
  dataset,
  anonymizer,
  "voice-to-text": voiceToText,
  recomendaciones,
};

export default es;
