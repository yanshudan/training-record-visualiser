---
description: 'Project agent for the Training Record Visualiser. Carries the key architecture and design decisions so changes stay consistent. Use when adding features, changing the data schema, or touching storage/auth.'
---

# Training Record Visualiser — Project Agent

You iterate on a single-page React + MUI training app built on **Vite**. Keep changes
consistent with the decisions below. When a decision changes, update this file and
`/memories/repo/design-decisions.md`.

## Product (4 features)
1. **Today** — generate today's targets from history + overload rules; per-set & rest
   timers; slide reps/weight when targets missed; add exercises in place; save session.
2. **Plan** — CRUD exercises + ordered progressive-overload rules.
3. **Timetable** — daily schedule, switchable **clock** / **flow** view.
4. **Stats** — per-body-part visualisation from the user's own exercise definitions.

## Architecture (do not break these boundaries)
- **Schema** `src/data/schema.ts`: versioned JSON, `schemaVersion` on every blob (current `2`).
- **Storage** `src/storage/*`: everything goes through `StorageProvider`
  (`read`/`write` with ETag optimistic concurrency). Providers: `LocalStorageProvider`,
  `SasBlobStorageProvider`, `BackendStorageProvider`; chosen by `storageFactory`.
  Logical keys (`records.json`, `exercises.json`, `timetable.json`) resolve to
  `users/{userId}/{key}`.
- **Identity** `src/auth/AuthContext.tsx`: app is **multi-user**, keyed by `userId`.
  Real auth (MSAL/Entra) plugs in here later.
- **App data** `src/state/AppDataContext.tsx`: single source of truth; loads docs,
  runs migrations, persists full-overwrite docs with ETags. Reloads on `ConcurrencyError`.
- **Domain** `src/domain/*`: `progressiveOverload`, `planGenerator`, `stats` — keep
  business logic here, not in components.
- **Backend** `server/`: per-user blob proxy + SAS issuance; account key stays server-side.

## Hard rules
- **Never** put a storage account key or connection string in client code.
- `records.json` is a **full accumulating array**, overwritten whole on save. Rely on
  Azure **Blob Versioning + Soft Delete** for recovery; use ETag/If-Match for concurrency.
- All new per-user data must live under `users/{userId}/…` and carry `schemaVersion`.
- Migrations live in `src/data/migration.ts` and must be **idempotent**.
- Legacy plain-text parsing lives only in `src/data/legacySerializer.ts` (migration only;
  never write that format again).

## When changing the schema
Bump `SCHEMA_VERSION`, add a forward transform in `runMigrations`, and verify
`npm run typecheck` plus a load of existing data.

## Commands
- `npm run dev` — start app (port 3123)
- `npm run build` / `npm run typecheck`
- `cd server && npm start` — backend
