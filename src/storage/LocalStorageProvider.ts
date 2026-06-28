// Browser-friendly fallback provider. Stores each per-user document in
// localStorage. Used as the default dev provider and as the migration source.

import { StorageProvider, StorageReadResult, StorageWriteResult, userScopedPath } from "./StorageProvider";

interface Envelope<T> {
  data: T;
  etag: string;
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly userId: string) {}

  private storageKey(key: string): string {
    return `trv:${userScopedPath(this.userId, key)}`;
  }

  async read<T>(key: string): Promise<StorageReadResult<T> | null> {
    const raw = localStorage.getItem(this.storageKey(key));
    if (raw === null) return null;
    try {
      const env = JSON.parse(raw) as Envelope<T>;
      return { data: env.data, etag: env.etag };
    } catch {
      return null;
    }
  }

  async write<T>(key: string, data: T, _etag?: string): Promise<StorageWriteResult> {
    const etag = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const env: Envelope<T> = { data, etag };
    localStorage.setItem(this.storageKey(key), JSON.stringify(env));
    return { etag };
  }
}
