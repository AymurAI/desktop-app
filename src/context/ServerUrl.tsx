import { createContext, Dispatch, ReactNode, useState } from "react";

/**
 * Context used to save the URL from which user will connect to Aymurai
 */
export const ServerUrlContext = createContext<UrlContextType>({
  serverUrl: "",
  setServerUrl: () => {},
});
ServerUrlContext.displayName = "UrlContext";

interface Props {
  children?: ReactNode;
}

interface UrlContextType {
  serverUrl: string;
  setServerUrl: Dispatch<React.SetStateAction<string>>;
}

export default function UrlProvider({ children }: Props) {
  const [url, setUrl] = useState<string>(
    localStorage.getItem("serverUrl") ?? ""
  );

  return (
    <ServerUrlContext.Provider value={{ serverUrl: url, setServerUrl: setUrl }}>
      {children}
    </ServerUrlContext.Provider>
  );
}
