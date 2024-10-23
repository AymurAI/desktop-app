import { useContext } from "react";

import { ServerUrlContext as Context } from "context/ServerUrl";

export default function useServerUrl() {
  const { serverUrl } = useContext(Context);
  return serverUrl;
}
