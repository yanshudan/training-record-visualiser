// Chooses a StorageProvider for the active user based on configuration. Reads
// build-time env vars but lets a runtime override (saved on the Settings page)
// win, so you can paste a SAS URL without rebuilding.

import { BackendStorageProvider } from "./BackendStorageProvider";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { SasBlobStorageProvider } from "./SasBlobStorageProvider";
import { StorageProvider } from "./StorageProvider";

export type ProviderKind = "sas" | "backend" | "local";

export interface StorageSettings {
  provider: ProviderKind;
  sasUrl?: string;
  backendBaseUrl?: string;
}

const SETTINGS_KEY = "trv:storageSettings";

export function loadStorageSettings(): StorageSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StorageSettings;
    } catch {
      /* fall through to env defaults */
    }
  }
  return {
    provider: (import.meta.env.VITE_STORAGE_PROVIDER as ProviderKind) ?? "local",
    sasUrl: import.meta.env.VITE_BLOB_CONTAINER_SAS_URL,
    backendBaseUrl: import.meta.env.VITE_BACKEND_BASE_URL,
  };
}

export function saveStorageSettings(settings: StorageSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export interface CreateProviderArgs {
  settings: StorageSettings;
  userId: string;
  getToken: () => string | undefined;
}

export function createStorageProvider({ settings, userId, getToken }: CreateProviderArgs): StorageProvider {
  switch (settings.provider) {
    case "sas":
      if (!settings.sasUrl) {
        throw new Error("SAS storage selected but no container SAS URL configured.");
      }
      return new SasBlobStorageProvider(settings.sasUrl, userId);
    case "backend":
      if (!settings.backendBaseUrl) {
        throw new Error("Backend storage selected but no backend base URL configured.");
      }
      return new BackendStorageProvider(settings.backendBaseUrl, getToken);
    case "local":
    default:
      return new LocalStorageProvider(userId);
  }
}
