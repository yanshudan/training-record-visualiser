// Direct-to-blob provider for SAS mode (single personal user, no backend).
// The configured SAS URL is container-scoped; we resolve each logical key to
// `users/{userId}/{key}` so the on-disk layout stays multi-user ready.
//
// Bug-tolerance: enable Blob Versioning + Soft Delete on the container so every
// full-overwrite keeps a recoverable previous version. We additionally use
// ETag conditions for optimistic concurrency.

import { ContainerClient } from "@azure/storage-blob";
import {
  ConcurrencyError,
  StorageProvider,
  StorageReadResult,
  StorageWriteResult,
  userScopedPath,
} from "./StorageProvider";

export class SasBlobStorageProvider implements StorageProvider {
  private readonly container: ContainerClient;

  constructor(containerSasUrl: string, private readonly userId: string) {
    this.container = new ContainerClient(containerSasUrl);
  }

  async read<T>(key: string): Promise<StorageReadResult<T> | null> {
    const blob = this.container.getBlockBlobClient(userScopedPath(this.userId, key));
    try {
      const resp = await blob.download();
      const body = await resp.blobBody;
      const text = body ? await body.text() : "";
      if (!text) return null;
      return { data: JSON.parse(text) as T, etag: resp.etag };
    } catch (err: unknown) {
      if (isStatus(err, 404)) return null;
      throw err;
    }
  }

  async write<T>(key: string, data: T, etag?: string): Promise<StorageWriteResult> {
    const blob = this.container.getBlockBlobClient(userScopedPath(this.userId, key));
    const text = JSON.stringify(data);
    try {
      const resp = await blob.upload(text, text.length, {
        blobHTTPHeaders: { blobContentType: "application/json" },
        conditions: etag ? { ifMatch: etag } : undefined,
      });
      return { etag: resp.etag };
    } catch (err: unknown) {
      if (isStatus(err, 412)) throw new ConcurrencyError();
      throw err;
    }
  }
}

function isStatus(err: unknown, status: number): boolean {
  return typeof err === "object" && err !== null && (err as { statusCode?: number }).statusCode === status;
}
