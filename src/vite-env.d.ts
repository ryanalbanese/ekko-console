/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EKKO_API_URL: string;
  readonly VITE_EKKO_WS_URL: string;
  readonly VITE_EKKO_DEMO_MODE: string;
  readonly VITE_EKKO_AUTH_TOKEN?: string;
  readonly VITE_EKKO_IDENTITY_LABEL?: string;
  readonly VITE_EKKO_PUSH_SUBSCRIBE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


