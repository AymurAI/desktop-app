import axios from "axios";

const api = axios.create();

// Dev-only convenience: pre-set the base URL from VITE_DEV_HOST so the
// APIProtected screens render under `pnpm dev:web` without manually walking
// the connect-to-host flow (useful with VITE_USE_MOCK_STT=true for offline UI
// work). Inert in production builds and when the var is unset.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_HOST) {
  api.defaults.baseURL = import.meta.env.VITE_DEV_HOST;
}

export default api;
