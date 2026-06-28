# Training Record Visualiser

Plan, run, and visualise your strength training. React + MUI on Vite, with a
multi-user-ready Azure Blob storage layer.

> Full design, setup, storage modes, and the data-migration plan are documented
> in **[README.html](README.html)** (open it in a browser).

## Quick start

```powershell
npm install
npm run dev      # http://localhost:3123
```

Starts in **local** storage mode and auto-migrates legacy
`localStorage["trainingRecords"]` data to the v2 schema.

## Scripts

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the dev server (port 3123) |
| `npm run build`     | Typecheck + production build     |
| `npm run typecheck` | Type-check only                  |
| `npm run preview`   | Preview the production build     |

## Features

1. **Today** — generate today's plan from history + overload rules; per-set & rest timers; slide reps/weight; add exercises in place; save the session.
2. **Plan** — configure exercises and progressive-overload rules.
3. **Timetable** — daily schedule as a switchable clock / flow view.
4. **Stats** — per-body-part visualisations from your own exercise definitions.

## Storage modes

- `local` — browser only (default).
- `sas` — single user; paste a container SAS URL on the Settings page.
- `backend` — true multi-user; see [`server/`](server/README.md).

Account keys never live in client code. Enable **Blob Versioning + Soft Delete**
on the container for bug-tolerant full-overwrite saves.

## Iterating

A project agent at `.github/agents/training-visualiser.agent.md` records the key
design decisions — select it in the VS Code chat agent picker.
