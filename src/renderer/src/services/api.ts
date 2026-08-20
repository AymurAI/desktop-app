import { getServerHost } from "@/store/useLocal";
import { isWebApp } from "@/utils/app-mode";
import axios from "axios";

const api = axios.create();

// Dev-only convenience: pre-set the base URL from VITE_DEV_HOST so the
// APIProtected screens render under `pnpm dev:web` without manually walking
// the connect-to-host flow (useful with VITE_USE_MOCK_STT=true for offline UI
// work). Inert in production builds and when the var is unset.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_HOST) {
  api.defaults.baseURL = import.meta.env.VITE_DEV_HOST;
} else if (isWebApp()) {
  // The web build is always served by the same backend it talks to (either a
  // dedicated server or the bundled Docker image), so default to the page's
  // own origin instead of requiring a manual connect step. A previously
  // saved custom host (self-hosted setups with a separate API origin) wins.
  api.defaults.baseURL = getServerHost() ?? window.location.origin;
}

export default api;
