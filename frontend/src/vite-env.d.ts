/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // Base URL of the deployed backend API, e.g. "https://api.example.com/api".
  // Unset in dev — Vite's proxy handles relative "/api" locally.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
