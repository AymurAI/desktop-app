import { useContext } from "react";

import { ServerUrlContext as Context } from "context/ServerUrl";

export default function useServerUrl() {
	const { serverUrl, setServerUrl } = useContext(Context);
	return { serverUrl, setServerUrl };
}
