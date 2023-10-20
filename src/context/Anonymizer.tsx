import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

type AnonymizerType = {
  anonymizedText: string;
  setAnonymizedText: Dispatch<SetStateAction<string>>;
};

export const AnonymizerContext = createContext<AnonymizerType>({
  anonymizedText: "",
  setAnonymizedText: () => {},
});
AnonymizerContext.displayName = "AnonymizerContext";

interface Props {
  children?: ReactNode;
}

export default function AnonymizerProvider({ children }: Props) {
  const [anonymizedText, setAnonymizedText] = useState("");

  return (
    <AnonymizerContext.Provider value={{ anonymizedText, setAnonymizedText }}>
      {children}
    </AnonymizerContext.Provider>
  );
}
