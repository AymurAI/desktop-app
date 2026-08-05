import axios from "axios";

const api = axios.create();

// Dev-only convenience: pre-set the base URL from VITE_DEV_HOST so the
// APIProtected screens render under `pnpm dev:web` without manually walking
// the connect-to-host flow (useful with VITE_USE_MOCK_STT=true for offline UI
// work). Inert in production builds and when the var is unset.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_HOST) {
  api.defaults.baseURL = import.meta.env.VITE_DEV_HOST;
}

// Dev-only convenience, same rationale as the VITE_DEV_HOST block above: in
// mock mode every Recomendaciones request is short-circuited by the mock
// layer, so the base URL is never actually dialled — it only needs to be
// truthy so `APIProtected` (which gates on `api.defaults.baseURL`) lets the
// flow render instead of redirecting to "/" for want of a completed
// connect-to-host handshake. The flag is re-read directly from
// `import.meta.env` here (instead of importing the parsed
// `USE_MOCK_RECOMENDACIONES` from `constants/config.ts`) to avoid a
// config.ts <-> api.ts import cycle risk as either file grows.
if (
  import.meta.env.DEV &&
  !import.meta.env.VITE_DEV_HOST &&
  import.meta.env.VITE_USE_MOCK_RECOMENDACIONES === "true"
) {
  api.defaults.baseURL = "http://mock.local";
}

export default api;
