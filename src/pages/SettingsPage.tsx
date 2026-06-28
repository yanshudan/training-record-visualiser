// Settings — identity (multi-user) and storage backend configuration. Lets you
// pick local/SAS/backend storage and paste a SAS URL at runtime without a
// rebuild. Account keys are never entered here.

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../state/AppDataContext";
import {
  loadStorageSettings,
  ProviderKind,
  saveStorageSettings,
  StorageSettings,
} from "../storage/storageFactory";

export function SettingsPage() {
  const { profile, signIn } = useAuth();
  const { reload, records, exercises } = useAppData();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [userId, setUserId] = useState(profile.userId);
  const [token, setToken] = useState(profile.token ?? "");
  const [settings, setSettings] = useState<StorageSettings>(loadStorageSettings());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const applyAll = async () => {
    saveStorageSettings(settings);
    signIn({ userId: userId.trim() || "me", displayName: displayName.trim() || userId, token: token || undefined });
    await reload();
    setSavedMsg("Settings applied and data reloaded.");
  };

  const set = (patch: Partial<StorageSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Settings</Typography>
      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Identity
          </Typography>
          <Stack spacing={2}>
            <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} helperText="Data is stored under users/{userId}/. Multi-user safe." />
            <TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <TextField
              label="Bearer token (backend mode)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              helperText="Only used when storage = backend."
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Storage
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="Provider"
              value={settings.provider}
              onChange={(e) => set({ provider: e.target.value as ProviderKind })}
            >
              <MenuItem value="local">Local (browser only)</MenuItem>
              <MenuItem value="sas">Azure Blob via SAS (single user)</MenuItem>
              <MenuItem value="backend">Backend (multi-user)</MenuItem>
            </TextField>

            {settings.provider === "sas" && (
              <TextField
                label="Container SAS URL"
                value={settings.sasUrl ?? ""}
                onChange={(e) => set({ sasUrl: e.target.value })}
                placeholder="https://<account>.blob.core.windows.net/<container>?sv=..."
                helperText="Needs read/write/create/list. Enable blob versioning + soft delete on the container."
              />
            )}
            {settings.provider === "backend" && (
              <TextField
                label="Backend base URL"
                value={settings.backendBaseUrl ?? ""}
                onChange={(e) => set({ backendBaseUrl: e.target.value })}
                placeholder="http://localhost:7071"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Button variant="contained" size="large" onClick={applyAll}>
        Apply & reload
      </Button>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Data summary
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {records.length} training day(s) · {exercises.length} exercise definition(s).
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
