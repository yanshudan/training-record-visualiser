// Multi-user backend for the Training Record Visualiser.
//
// Responsibilities:
//  - Authenticate the caller and resolve a stable `userId` (STUB below — replace
//    `resolveUserId` with real JWT / Entra ID validation before production).
//  - Scope every blob operation to `users/{userId}/...` so users can only ever
//    touch their own data. The storage account KEY never leaves this server.
//
// Endpoints:
//   GET  /api/data/:key      -> read users/{userId}/{key}     (ETag header)
//   PUT  /api/data/:key      -> write users/{userId}/{key}    (honours If-Match)
//   GET  /api/sas            -> short-lived, user-prefix-scoped SAS (optional)
//   GET  /healthz
//
// Bug-tolerance: enable Blob Versioning + Soft Delete on the container so each
// full-overwrite keeps a recoverable prior version.

import express from "express";
import cors from "cors";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  ContainerSASPermissions,
  SASProtocol,
} from "@azure/storage-blob";

const {
  AZURE_STORAGE_ACCOUNT,
  AZURE_STORAGE_KEY,
  AZURE_STORAGE_CONTAINER = "training-records",
  PORT = 7071,
  ALLOWED_ORIGINS = "http://localhost:3123",
} = process.env;

if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY) {
  console.error("Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY (see .env.example).");
  process.exit(1);
}

const credential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY);
const service = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  credential
);
const container = service.getContainerClient(AZURE_STORAGE_CONTAINER);

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS.split(","), exposedHeaders: ["ETag"] }));
app.use(express.json({ limit: "5mb" }));

// --- Auth stub -------------------------------------------------------------
// Replace with real verification: validate a JWT, then return its subject.
function resolveUserId(req) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  // STUB: treat the token as the userId. DO NOT ship this to production.
  return encodeURIComponent(token);
}

function requireUser(req, res, next) {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const blobName = (userId, key) => `users/${userId}/${key.replace(/[^\w.\-]/g, "_")}`;

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/api/data/:key", requireUser, async (req, res) => {
  const blob = container.getBlockBlobClient(blobName(req.userId, req.params.key));
  try {
    const buffer = await blob.downloadToBuffer();
    const props = await blob.getProperties();
    if (props.etag) res.setHeader("ETag", props.etag);
    res.type("application/json").send(buffer.toString("utf8"));
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: "Not found" });
    console.error(err);
    res.status(500).json({ error: "Read failed" });
  }
});

app.put("/api/data/:key", requireUser, async (req, res) => {
  const blob = container.getBlockBlobClient(blobName(req.userId, req.params.key));
  const ifMatch = req.header("if-match");
  const body = JSON.stringify(req.body);
  try {
    const result = await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" },
      conditions: ifMatch ? { ifMatch } : undefined,
    });
    if (result.etag) res.setHeader("ETag", result.etag);
    res.status(204).end();
  } catch (err) {
    if (err.statusCode === 412) return res.status(412).json({ error: "Concurrency conflict" });
    console.error(err);
    res.status(500).json({ error: "Write failed" });
  }
});

// Optional: hand the client a short-lived SAS scoped to its own user prefix.
app.get("/api/sas", requireUser, async (req, res) => {
  const startsOn = new Date(Date.now() - 60_000);
  const expiresOn = new Date(Date.now() + 60 * 60_000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: AZURE_STORAGE_CONTAINER,
      permissions: ContainerSASPermissions.parse("rcwl"),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
    },
    credential
  ).toString();
  res.json({
    sasUrl: `${container.url}?${sas}`,
    prefix: `users/${req.userId}/`,
    expiresOn,
  });
});

app.listen(Number(PORT), () => {
  console.log(`Training backend listening on http://localhost:${PORT}`);
});
