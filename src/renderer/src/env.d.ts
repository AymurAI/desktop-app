/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_STT?: string;
  readonly VITE_STT_MOCK_DELAY_MS?: string;
  readonly VITE_ASR_USE_CACHE?: string;
  readonly VITE_DEV_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
