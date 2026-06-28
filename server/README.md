# Backend (multi-user)

Authenticates each request and scopes all Azure Blob access to
`users/{userId}/...`. The storage account key stays on the server only.

## Run

```powershell
cd server
npm install
Copy-Item .env.example .env   # then fill in AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY
npm start
```

Point the web app at it: Settings → Storage → Backend, base URL `http://localhost:7071`,
and set a Bearer token (in the stub, the token *is* the userId).

## Endpoints

| Method | Path             | Purpose                                  |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/healthz`       | Liveness check                           |
| GET    | `/api/data/:key` | Read `users/{userId}/{key}` (ETag)       |
| PUT    | `/api/data/:key` | Write doc (honours `If-Match`)           |
| GET    | `/api/sas`       | Short-lived SAS scoped to the user prefix |

## Production checklist

- Replace `resolveUserId` with real JWT / Microsoft Entra ID validation.
- Enable **Blob Versioning** + **Soft Delete** on the container.
- Restrict `ALLOWED_ORIGINS` to your deployed web origin.
- Prefer Managed Identity over an account key where possible.
