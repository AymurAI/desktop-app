import anonymizer from "./anonymizer";
import common from "./common";
import dataset from "./dataset";
import summarizer from "./summarizer";
import voiceToText from "./voice-to-text";

const es = {
  common,
  dataset,
  anonymizer,
  "voice-to-text": voiceToText,
  summarizer,
};

export default es;
