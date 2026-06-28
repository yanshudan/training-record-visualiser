// Feature 3 — "Daily time table".
// Define a daily schedule and visualise it as a 24h clock OR a vertical flow,
// switchable. Entries are stored per user in timetable.json.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import { useAppData } from "../state/AppDataContext";
import { makeId, TimetableEntry } from "../data/schema";
import { minLabel, TimetableClock } from "../components/TimetableClock";

const PALETTE = ["#00f260", "#0d87e8", "#ff00cc", "#f7b733", "#fc4a1a", "#ffff00", "#9b5de5"];

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function TimetablePage() {
  const { timetable, saveTimetable } = useAppData();
  const [view, setView] = useState<"clock" | "flow">("clock");
  const [draft, setDraft] = useState<TimetableEntry[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft([...timetable].sort((a, b) => a.startMinute - b.startMinute));
  }, [timetable]);

  const update = (id: string, patch: Partial<TimetableEntry>) => {
    setDraft((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setDirty(true);
  };

  const addEntry = () => {
    const start = draft.length ? Math.min(1380, draft[draft.length - 1].endMinute) : 8 * 60;
    setDraft((prev) => [
      ...prev,
      {
        id: makeId("tt"),
        label: "New block",
        startMinute: start,
        endMinute: Math.min(1439, start + 60),
        color: PALETTE[prev.length % PALETTE.length],
      },
    ]);
    setDirty(true);
  };

  const remove = (id: string) => {
    setDraft((prev) => prev.filter((e) => e.id !== id));
    setDirty(true);
  };

  const save = async () => {
    await saveTimetable([...draft].sort((a, b) => a.startMinute - b.startMinute));
    setDirty(false);
  };

  const sorted = [...draft].sort((a, b) => a.startMinute - b.startMinute);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Daily timetable
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v) => v && setView(v)}
        >
          <ToggleButton value="clock">Clock</ToggleButton>
          <ToggleButton value="flow">Flow</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!dirty}>
          Save
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {view === "clock" ? (
            <Stack alignItems="center">
              <TimetableClock entries={sorted} />
            </Stack>
          ) : (
            <Stack spacing={1}>
              {sorted.length === 0 && <Typography color="text.secondary">No blocks yet.</Typography>}
              {sorted.map((e) => (
                <Stack key={e.id} direction="row" spacing={2} alignItems="center">
                  <Typography sx={{ width: 110, fontVariantNumeric: "tabular-nums" }} color="text.secondary">
                    {minLabel(e.startMinute)}–{minLabel(e.endMinute)}
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      bgcolor: e.color,
                      color: "#000",
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75,
                      minHeight: Math.max(28, (e.endMinute - e.startMinute) / 6),
                    }}
                  >
                    {e.label}
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Edit blocks
        </Typography>
        <Button startIcon={<AddIcon />} onClick={addEntry}>
          Add block
        </Button>
      </Stack>

      {draft.map((e) => (
        <Card key={e.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="Label"
                value={e.label}
                onChange={(ev) => update(e.id, { label: ev.target.value })}
              />
              <TextField
                size="small"
                type="time"
                label="Start"
                value={minLabel(e.startMinute)}
                onChange={(ev) => update(e.id, { startMinute: timeToMinutes(ev.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="time"
                label="End"
                value={minLabel(e.endMinute)}
                onChange={(ev) => update(e.id, { endMinute: timeToMinutes(ev.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
              <Stack direction="row" spacing={0.5}>
                {PALETTE.map((c) => (
                  <Box
                    key={c}
                    onClick={() => update(e.id, { color: c })}
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: "pointer",
                      border: e.color === c ? "2px solid #fff" : "2px solid transparent",
                    }}
                  />
                ))}
              </Stack>
              <Chip size="small" label={`${(e.endMinute - e.startMinute)} min`} />
              <IconButton onClick={() => remove(e.id)} sx={{ ml: "auto" }}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
