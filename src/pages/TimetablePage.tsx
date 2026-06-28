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

const PALETTE = ["#8bab9b", "#7a9cc6", "#c69ab8", "#d3b173", "#cf8d76", "#b9b87e", "#9b8fc0"];

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Live minutes-from-midnight, ticking once per minute. */
function useNowMinute(): number {
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TimetablePage() {
  const { timetable, saveTimetable } = useAppData();
  const [view, setView] = useState<"clock" | "flow">("flow");
  const [draft, setDraft] = useState<TimetableEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const nowMin = useNowMinute();

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

  const activeEntry =
    sorted.find((e) => nowMin >= e.startMinute && nowMin < e.endMinute) ?? null;
  const nextEntry = sorted.find((e) => e.startMinute > nowMin) ?? null;
  const minsUntilNext = nextEntry ? nextEntry.startMinute - nowMin : null;

  const statusBanner = (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ mb: 2, width: "100%" }}
    >
      <Chip
        size="small"
        label={
          activeEntry
            ? `NOW · ${activeEntry.label} · until ${minLabel(activeEntry.endMinute)}`
            : "NOW · Free"
        }
        sx={{
          fontWeight: 700,
          color: "#000",
          bgcolor: activeEntry ? activeEntry.color : "rgba(255,255,255,0.18)",
        }}
      />
      {nextEntry ? (
        <Chip
          size="small"
          variant="outlined"
          label={`Next · ${nextEntry.label} · in ${minsUntilNext} min at ${minLabel(
            nextEntry.startMinute,
          )}`}
          sx={{ fontWeight: 600 }}
        />
      ) : (
        <Chip size="small" variant="outlined" label="Nothing else scheduled" />
      )}
    </Stack>
  );

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
          {statusBanner}
          {view === "clock" ? (
            <Stack alignItems="center">
              <TimetableClock entries={sorted} nowMinute={nowMin} activeId={activeEntry?.id} />
            </Stack>
          ) : (
            <Stack spacing={0}>
              {sorted.length === 0 && <Typography color="text.secondary">No blocks yet.</Typography>}
              {sorted.map((e) => {
                const duration = e.endMinute - e.startMinute;
                const isActive = e.id === activeEntry?.id;
                const progress = isActive
                  ? Math.min(1, Math.max(0, (nowMin - e.startMinute) / duration))
                  : 0;
                return (
                  <Stack key={e.id} direction="row" spacing={2} alignItems="stretch" sx={{ minHeight: 0 }}>
                    <Stack sx={{ width: 52, pt: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}
                      >
                        {minLabel(e.startMinute)}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        position: "relative",
                        flexGrow: 1,
                        bgcolor: e.color,
                        color: "#000",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.75,
                        mb: 1,
                        overflow: "hidden",
                        height: Math.max(40, duration * 1.1),
                        boxShadow: isActive ? "0 0 0 2px #fff, 0 0 12px rgba(255,122,0,0.6)" : "none",
                      }}
                    >
                      {isActive && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${progress * 100}%`,
                            height: 2,
                            bgcolor: "#ff7a00",
                            boxShadow: "0 0 6px #ff7a00",
                          }}
                        />
                      )}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 700 }}>{e.label}</Typography>
                        {isActive && (
                          <Chip
                            size="small"
                            label="NOW"
                            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#ff7a00", color: "#fff" }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {minLabel(e.startMinute)}–{minLabel(e.endMinute)} · {duration} min
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
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
                onChange={(ev) => {
                  const start = timeToMinutes(ev.target.value);
                  const dur = Math.max(5, e.endMinute - e.startMinute);
                  update(e.id, { startMinute: start, endMinute: Math.min(1439, start + dur) });
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <TextField
                size="small"
                type="number"
                label="Duration (min)"
                value={e.endMinute - e.startMinute}
                onChange={(ev) => {
                  const dur = Math.max(5, Math.round(Number(ev.target.value) / 5) * 5 || 5);
                  update(e.id, { endMinute: Math.min(1439, e.startMinute + dur) });
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 5, min: 5 }}
                sx={{ width: 130 }}
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
              <Chip size="small" label={`ends ${minLabel(e.endMinute)}`} />
              <IconButton onClick={() => remove(e.id)} sx={{ ml: "auto" }}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {/* Large add button at the foot of a long list, so you don't have to
          scroll back up to the header action. */}
      {draft.length > 4 && (
        <Button
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<AddIcon />}
          onClick={addEntry}
          sx={{ py: 1.5 }}
        >
          Add block
        </Button>
      )}
    </Stack>
  );
}
