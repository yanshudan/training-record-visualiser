// Exercises — manage exercise definitions and the body parts that categorise
// them. Filterable + sortable. The default set/rep/weight templates are kept in
// the data model (used when seeding plans) but hidden from this UI. Changes are
// committed with the Save button (no auto-save, to keep the UI responsive).

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import { useAppData } from "../state/AppDataContext";
import { ExerciseDef, makeId, OverloadRule, Unit } from "../data/schema";
import { bodyPartOrder } from "../data/bodyParts";
import { gradientTextColor, resolveBodyPartColor, bodyPartGradient } from "../data/bodyPartColors";

const UNITS: Unit[] = ["kg", "lb", "km", "bpm", "min"];

// Working-set templates kept in the model (used when seeding plans) but not
// editable from this page.
const DEFAULT_SETS = 4;
const DEFAULT_REPS = 12;
const DEFAULT_WEIGHT = 20;

// A single recolourable body-part pill. It keeps the live colour in LOCAL state
// while the native picker is open (so only this chip re-renders on every drag
// tick) and commits to the page draft once, on close/blur. This keeps the rest
// of the page — the whole exercise list — from re-rendering on every tick.
function BodyPartColorChip({
  part,
  color,
  mode,
  onCommit,
}: {
  part: string;
  color: string;
  mode: "light" | "dark";
  onCommit: (color: string) => void;
}) {
  const [local, setLocal] = useState(color);
  useEffect(() => setLocal(color), [color]);
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }} title={`Click to recolour ${part}`}>
      <Chip
        size="small"
        label={part}
        sx={{
          background: bodyPartGradient(local, mode),
          color: gradientTextColor(local, mode),
          fontWeight: 600,
        }}
      />
      <Box
        component="input"
        type="color"
        value={local}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== color) onCommit(local);
        }}
        aria-label={`Colour for ${part}`}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          m: 0,
          p: 0,
          border: "none",
          background: "transparent",
          opacity: 0,
          cursor: "pointer",
        }}
      />
    </Box>
  );
}

export function ExercisesPage() {
  const { exercises, bodyParts, bodyPartColors, saveExercises } = useAppData();
  const mode = useTheme().palette.mode;
  const [draft, setDraft] = useState<ExerciseDef[]>([]);
  const [partsDraft, setPartsDraft] = useState<string[]>([]);
  const [colorsDraft, setColorsDraft] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Once the user edits, the local draft is authoritative until a reload.
  const touched = useRef(false);

  const [search, setSearch] = useState("");
  const [filterPart, setFilterPart] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "bodyPart">("name");
  const [newPart, setNewPart] = useState("");

  useEffect(() => {
    if (touched.current) return;
    setDraft(exercises);
    setColorsDraft({ ...bodyPartColors });
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const p of bodyParts) {
      if (!seen.has(p)) {
        seen.add(p);
        ordered.push(p);
      }
    }
    for (const e of exercises) {
      if (!seen.has(e.bodyPart)) {
        seen.add(e.bodyPart);
        ordered.push(e.bodyPart);
      }
    }
    setPartsDraft(ordered.length ? ordered : [...bodyPartOrder]);
  }, [exercises, bodyParts, bodyPartColors]);

  // Record a user edit and mark the draft dirty so it can be saved.
  const mark = () => {
    touched.current = true;
    setDirty(true);
    setSaveError(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await saveExercises(draft, partsDraft, colorsDraft);
      setDirty(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const update = (id: string, patch: Partial<ExerciseDef>) => {
    setDraft((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    mark();
  };

  const updateRule = (id: string, idx: number, patch: Partial<OverloadRule>) => {
    setDraft((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, overloadRules: e.overloadRules.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }
          : e
      )
    );
    mark();
  };

  const addRule = (id: string) => {
    setDraft((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, overloadRules: [...e.overloadRules, { kind: "addReps", amount: 1 } as OverloadRule] }
          : e
      )
    );
    mark();
  };

  const removeRule = (id: string, idx: number) => {
    setDraft((prev) =>
      prev.map((e) => (e.id === id ? { ...e, overloadRules: e.overloadRules.filter((_, i) => i !== idx) } : e))
    );
    mark();
  };

  const addExercise = () => {
    setDraft((prev) => [
      {
        id: makeId("ex"),
        name: "New exercise",
        bodyPart: filterPart || partsDraft[0] || "Other",
        unit: "kg",
        defaultSets: DEFAULT_SETS,
        defaultReps: DEFAULT_REPS,
        defaultWeight: DEFAULT_WEIGHT,
        overloadRules: [{ kind: "addReps", amount: 1 }],
      },
      ...prev,
    ]);
    mark();
  };

  const removeExercise = (id: string) => {
    setDraft((prev) => prev.filter((e) => e.id !== id));
    mark();
  };

  const addBodyPart = () => {
    const name = newPart.trim();
    if (!name || partsDraft.includes(name)) return;
    setPartsDraft((prev) => [...prev, name]);
    setNewPart("");
    mark();
  };

  const setPartColor = (part: string, color: string) => {
    setColorsDraft((prev) => ({ ...prev, [part]: color }));
    mark();
  };

  const partColor = (part: string) => resolveBodyPartColor(part, partsDraft, colorsDraft);

  const partOptions = partsDraft;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return draft
      .filter((e) => (filterPart ? e.bodyPart === filterPart : true))
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
      .sort((a, b) =>
        sortBy === "name"
          ? a.name.localeCompare(b.name)
          : a.bodyPart.localeCompare(b.bodyPart) || a.name.localeCompare(b.name)
      );
  }, [draft, search, filterPart, sortBy]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Exercises
        </Typography>
        {saveError && <Chip size="small" color="error" label="Save failed" />}
        <Button
          variant="contained"
          onClick={save}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
        <Button startIcon={<AddIcon />} onClick={addExercise}>
          Add exercise
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <TextField
              size="small"
              placeholder="Search exercises"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200, flexGrow: 1 }}
            />
            <TextField
              select
              size="small"
              label="Body part"
              value={filterPart}
              onChange={(e) => setFilterPart(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              {partOptions.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "bodyPart")}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="bodyPart">Body part</MenuItem>
            </TextField>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Body parts <em>(tap a pill to change its colour)</em>:
            </Typography>
            {partOptions.map((p) => (
              <BodyPartColorChip
                key={p}
                part={p}
                color={partColor(p)}
                mode={mode}
                onCommit={(color) => setPartColor(p, color)}
              />
            ))}
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              size="small"
              label="New body part"
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addBodyPart();
              }}
              sx={{ minWidth: 160 }}
            />
            <Button startIcon={<AddIcon />} onClick={addBodyPart} disabled={!newPart.trim()}>
              Add
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {visible.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No exercises match — adjust the filter or add one.
        </Typography>
      )}

      {visible.map((ex) => (
        <Card key={ex.id}>
          <CardContent>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <TextField
                size="small"
                label="Name"
                value={ex.name}
                onChange={(e) => update(ex.id, { name: e.target.value })}
              />
              <TextField
                select
                size="small"
                label="Body part"
                value={ex.bodyPart}
                onChange={(e) => update(ex.id, { bodyPart: e.target.value })}
                sx={{ minWidth: 130 }}
              >
                {[...new Set([...partOptions, ex.bodyPart])].map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Unit"
                value={ex.unit}
                onChange={(e) => update(ex.id, { unit: e.target.value as Unit })}
                sx={{ minWidth: 90 }}
              >
                {UNITS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
              <Chip size="small" label={ex.bodyPart} sx={{ background: bodyPartGradient(partColor(ex.bodyPart), mode), color: gradientTextColor(partColor(ex.bodyPart), mode), fontWeight: 600 }} />
              <IconButton onClick={() => removeExercise(ex.id)} sx={{ ml: "auto" }}>
                <DeleteIcon />
              </IconButton>
            </Stack>

            <Accordion sx={{ mt: 2 }} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Progressive overload rules ({ex.overloadRules.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  {ex.overloadRules.map((rule, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <TextField
                        select
                        size="small"
                        label="Rule"
                        value={rule.kind}
                        onChange={(e) => updateRule(ex.id, idx, { kind: e.target.value as OverloadRule["kind"] })}
                        sx={{ minWidth: 150 }}
                      >
                        <MenuItem value="addReps">Add reps</MenuItem>
                        <MenuItem value="addWeight">Add weight</MenuItem>
                      </TextField>
                      <TextField
                        size="small"
                        type="number"
                        label="Amount"
                        value={rule.amount}
                        onChange={(e) => updateRule(ex.id, idx, { amount: Number(e.target.value) })}
                        sx={{ width: 110 }}
                      />
                      {rule.kind === "addWeight" && (
                        <>
                          <TextField
                            size="small"
                            type="number"
                            label="When reps ≥"
                            value={rule.whenRepsAtLeast ?? 0}
                            onChange={(e) => updateRule(ex.id, idx, { whenRepsAtLeast: Number(e.target.value) })}
                            sx={{ width: 130 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Reset reps to"
                            value={rule.resetRepsTo ?? 0}
                            onChange={(e) => updateRule(ex.id, idx, { resetRepsTo: Number(e.target.value) })}
                            sx={{ width: 130 }}
                          />
                        </>
                      )}
                      <IconButton size="small" onClick={() => removeRule(ex.id, idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addRule(ex.id)} sx={{ alignSelf: "flex-start" }}>
                    Add rule
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
