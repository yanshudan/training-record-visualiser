/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORAGE_PROVIDER?: "sas" | "backend" | "local";
  readonly VITE_BLOB_CONTAINER_SAS_URL?: string;
  readonly VITE_SAS_USER_ID?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
