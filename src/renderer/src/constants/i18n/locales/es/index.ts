import anonymizer from "./anonymizer";
import common from "./common";
import dataset from "./dataset";
import recomendaciones from "./recomendaciones";
import summarizer from "./summarizer";
import voiceToText from "./voice-to-text";

const es = {
  common,
  dataset,
  anonymizer,
  "voice-to-text": voiceToText,
  recomendaciones,
  summarizer,
};

export default es;
