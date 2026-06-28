// Storage abstraction. The app reads/writes a small set of logical JSON
// documents (`records.json`, `exercises.json`, `timetable.json`). Each provider
// resolves those logical keys to a per-user location, so the entire app is
// multi-user by construction regardless of which backend is configured.
//
// Optimistic concurrency: read() returns an opaque `etag`; pass it back to
// write() to ensure you don't clobber a newer copy (ConcurrencyError on clash).

export interface StorageReadResult<T> {
  data: T;
  etag?: string;
}

export interface StorageWriteResult {
  etag?: string;
}

export interface StorageProvider {
  /** Logical key, e.g. "records.json". Returns null if not found. */
  read<T>(key: string): Promise<StorageReadResult<T> | null>;
  /** Write a document. Pass `etag` from a prior read for safe overwrite. */
  write<T>(key: string, data: T, etag?: string): Promise<StorageWriteResult>;
}

export class ConcurrencyError extends Error {
  constructor(message = "The document was modified by another writer.") {
    super(message);
    this.name = "ConcurrencyError";
  }
}

/** Build the per-user blob/object path for a logical key. */
export function userScopedPath(userId: string, key: string): string {
  const safeUser = encodeURIComponent(userId);
  return `users/${safeUser}/${key}`;
}
