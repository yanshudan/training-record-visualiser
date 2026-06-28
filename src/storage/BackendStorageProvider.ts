// Multi-user provider. Talks to the backend, which authenticates the user from
// the bearer token and proxies/scopes blob access to that user only. The client
// never sees the storage account key or another user's data.

import {
  ConcurrencyError,
  StorageProvider,
  StorageReadResult,
  StorageWriteResult,
} from "./StorageProvider";

export class BackendStorageProvider implements StorageProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | undefined
  ) {}

  private headers(extra?: Record<string, string>): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  async read<T>(key: string): Promise<StorageReadResult<T> | null> {
    const resp = await fetch(`${this.baseUrl}/api/data/${encodeURIComponent(key)}`, {
      headers: this.headers(),
    });
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error(`Backend read failed (${resp.status})`);
    const etag = resp.headers.get("ETag") ?? undefined;
    return { data: (await resp.json()) as T, etag };
  }

  async write<T>(key: string, data: T, etag?: string): Promise<StorageWriteResult> {
    const resp = await fetch(`${this.baseUrl}/api/data/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: this.headers(etag ? { "If-Match": etag } : undefined),
      body: JSON.stringify(data),
    });
    if (resp.status === 412) throw new ConcurrencyError();
    if (!resp.ok) throw new Error(`Backend write failed (${resp.status})`);
    return { etag: resp.headers.get("ETag") ?? undefined };
  }
}
