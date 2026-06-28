// Feature 2 — "Configure your plan".
// Group exercises into reusable training days (Day 1: a, b, c) and orchestrate
// them into a repeating rotation (day1, day2, day1, day2, day3). Both sections
// are foldable and reorderable by drag & drop. The exercise definitions
// themselves are edited on the Exercises page.

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useAppData } from "../state/AppDataContext";
import { saveStatusLabel, useDebouncedSave } from "../state/useAutoSave";
import { ExerciseDef, makeId, PlanDay } from "../data/schema";
import { bodyPartOrder } from "../data/bodyParts";
import { bodyPartGradient, gradientTextColor } from "../data/bodyPartColors";

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PlanPage() {
  const { exercises, bodyParts, planDays, rotation, savePlan, saveExercises, colorForBodyPart } = useAppData();
  const mode = useTheme().palette.mode;
  const [days, setDays] = useState<PlanDay[]>([]);
  const [rota, setRota] = useState<string[]>([]);
  const [exDraft, setExDraft] = useState<ExerciseDef[]>([]);
  const [signal, setSignal] = useState(0);
  const [exSignal, setExSignal] = useState(0);
  // Once the user edits, the local draft is authoritative until a reload.
  const touched = useRef(false);
  // The row currently being dragged; `key` scopes a drag to a single list so
  // exercises and rotation steps can't be dropped into each other.
  const dragRef = useRef<{ key: string; index: number } | null>(null);

  // Record a plan (days/rotation) edit and schedule an auto-save.
  const mark = () => {
    touched.current = true;
    setSignal((s) => s + 1);
  };
  // Record an exercise-template edit (sets/reps/weight) and schedule its save.
  const markEx = () => {
    touched.current = true;
    setExSignal((s) => s + 1);
  };
  // Shim so the existing handlers keep calling setDirty(true).
  const setDirty = (v: boolean) => {
    if (v) mark();
  };

  useEffect(() => {
    if (touched.current) return;
    setDays(planDays);
    setRota(rotation);
    setExDraft(exercises);
  }, [planDays, rotation, exercises]);

  const status = useDebouncedSave(signal, async () => {
    await savePlan(days, rota);
  });
  const exStatus = useDebouncedSave(exSignal, async () => {
    await saveExercises(exDraft);
  });
  // Combined save indicator for the header chip.
  const saveStatus =
    status === "error" || exStatus === "error"
      ? "error"
      : status === "saving" || exStatus === "saving"
      ? "saving"
      : status === "saved" || exStatus === "saved"
      ? "saved"
      : "idle";

  const parts = bodyParts.length ? bodyParts : bodyPartOrder;
  const exById = useMemo(() => new Map(exDraft.map((e) => [e.id, e])), [exDraft]);
  const nameOf = (id: string) => exById.get(id)?.name ?? "(removed)";
  const dayById = useMemo(() => new Map(days.map((d) => [d.id, d])), [days]);

  const updateExercise = (id: string, patch: Partial<ExerciseDef>) => {
    setExDraft((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    markEx();
  };

  // --- Drag & drop ------------------------------------------------------------
  // Only the drag handle starts a drag, so the inline number fields stay
  // editable. The row itself just handles drag-over / drop.

  const dropHandlers = (key: string, index: number, onReorder: (from: number, to: number) => void) => ({
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const d = dragRef.current;
      if (d && d.key === key && d.index !== index) onReorder(d.index, index);
      dragRef.current = null;
    },
  });

  const dragHandleHandlers = (key: string, index: number) => ({
    draggable: true,
    onDragStart: () => {
      dragRef.current = { key, index };
    },
  });

  // --- Training days editing --------------------------------------------------

  const addDay = () => {
    setDays((prev) => [...prev, { id: makeId("day"), name: `Day ${prev.length + 1}`, exerciseIds: [] }]);
    setDirty(true);
  };

  const updateDay = (id: string, patch: Partial<PlanDay>) => {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    setDirty(true);
  };

  const removeDay = (id: string) => {
    setDays((prev) => prev.filter((d) => d.id !== id));
    setRota((prev) => prev.filter((x) => x !== id));
    setDirty(true);
  };

  const addExerciseToDay = (dayId: string, exerciseId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId && !d.exerciseIds.includes(exerciseId)
          ? { ...d, exerciseIds: [...d.exerciseIds, exerciseId] }
          : d
      )
    );
    setDirty(true);
  };

  const removeExerciseFromDay = (dayId: string, idx: number) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exerciseIds: d.exerciseIds.filter((_, i) => i !== idx) } : d))
    );
    setDirty(true);
  };

  const reorderDayExercises = (dayId: string, from: number, to: number) => {
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exerciseIds: moveItem(d.exerciseIds, from, to) } : d))
    );
    setDirty(true);
  };

  // --- Rotation editing -------------------------------------------------------

  const addRotationStep = () => {
    if (days.length === 0) return;
    setRota((prev) => [...prev, days[0].id]);
    setDirty(true);
  };

  const setRotationStep = (idx: number, dayId: string) => {
    setRota((prev) => prev.map((x, i) => (i === idx ? dayId : x)));
    setDirty(true);
  };

  const removeRotationStep = (idx: number) => {
    setRota((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const reorderRotation = (from: number, to: number) => {
    setRota((prev) => moveItem(prev, from, to));
    setDirty(true);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Configure plan
        </Typography>
        {saveStatusLabel(saveStatus) && (
          <Chip
            size="small"
            color={saveStatus === "error" ? "error" : saveStatus === "saved" ? "success" : "default"}
            label={saveStatusLabel(saveStatus)}
          />
        )}
      </Stack>

      {/* ---- Training days ---- */}
      <Accordion defaultExpanded disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Training days</Typography>
          <Chip size="small" variant="outlined" label={`${days.length}`} sx={{ ml: 1 }} />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Group exercises into days (e.g. Day 1: a, b, c), then loop them in any order below. Drag rows to reorder.
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addDay} sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                Add day
              </Button>
            </Stack>

            {days.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No days yet — add one to start building your plan.
              </Typography>
            )}

            {days.map((day) => (
              <Card key={day.id}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      label="Day name"
                      value={day.name}
                      onChange={(e) => updateDay(day.id, { name: e.target.value })}
                    />
                    <Chip size="small" label={`${day.exerciseIds.length} exercises`} variant="outlined" />
                    <IconButton onClick={() => removeDay(day.id)} sx={{ ml: "auto" }}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={0.5}>
                    {day.exerciseIds.map((exId, idx) => {
                      const ex = exById.get(exId);
                      return (
                        <Stack
                          key={`${exId}-${idx}`}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          {...dropHandlers(`day:${day.id}`, idx, (from, to) => reorderDayExercises(day.id, from, to))}
                          sx={{
                            borderRadius: 1,
                            px: 0.5,
                            py: 0.75,
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <DragIndicatorIcon
                            fontSize="small"
                            {...dragHandleHandlers(`day:${day.id}`, idx)}
                            sx={{ color: "text.disabled", cursor: "grab", flexShrink: 0 }}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            {/* Line 1: exercise name followed by its body-part pill */}
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {idx + 1}.
                              </Typography>
                              <Typography sx={{ fontWeight: 600 }}>{nameOf(exId)}</Typography>
                              {ex && (
                                <Chip
                                  size="small"
                                  label={ex.bodyPart}
                                  sx={{
                                    background: bodyPartGradient(colorForBodyPart(ex.bodyPart), mode),
                                    color: gradientTextColor(colorForBodyPart(ex.bodyPart), mode),
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Stack>
                            {/* Line 2: editable working-set template */}
                            {ex && (
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 1 }}
                              >
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Weight"
                                  value={ex.defaultWeight}
                                  onChange={(e) => updateExercise(ex.id, { defaultWeight: Math.max(0, Number(e.target.value)) })}
                                  sx={{ width: 84 }}
                                  inputProps={{ min: 0 }}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end" sx={{ ml: 0 }}>
                                        {ex.unit}
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Sets"
                                  value={ex.defaultSets}
                                  onChange={(e) => updateExercise(ex.id, { defaultSets: Math.max(1, Number(e.target.value)) })}
                                  sx={{ width: 56 }}
                                  inputProps={{ min: 1 }}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Reps"
                                  value={ex.defaultReps}
                                  onChange={(e) => updateExercise(ex.id, { defaultReps: Math.max(0, Number(e.target.value)) })}
                                  sx={{ width: 64 }}
                                  inputProps={{ min: 0 }}
                                />
                              </Stack>
                            )}
                          </Box>
                          <IconButton size="small" onClick={() => removeExerciseFromDay(day.id, idx)} sx={{ flexShrink: 0 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      );
                    })}
                  </Stack>

                  <Autocomplete
                    sx={{ mt: 1.5, maxWidth: 360 }}
                    size="small"
                    options={exercises.filter((e) => !day.exerciseIds.includes(e.id))}
                    getOptionLabel={(o) => `${o.name} · ${o.bodyPart}`}
                    value={null}
                    onChange={(_, value) => value && addExerciseToDay(day.id, value.id)}
                    renderInput={(params) => <TextField {...params} label="Add exercise to this day" />}
                  />
                </CardContent>
              </Card>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* ---- Your Plan ---- */}
      <Accordion defaultExpanded disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Your Plan</Typography>
          <Chip size="small" variant="outlined" label={`${rota.length} days`} sx={{ ml: 1 }} />
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                The loop you cycle through. Today follows this order, returning to day 1 after the last. Drag to reorder.
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addRotationStep} disabled={days.length === 0} sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                Add day
              </Button>
            </Stack>

            <Card variant="outlined">
              <CardContent>
                {rota.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No plan yet — add days to define your loop.
                  </Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {rota.map((dayId, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        {...dropHandlers("rota", idx, reorderRotation)}
                        sx={{
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.25,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <DragIndicatorIcon
                          fontSize="small"
                          {...dragHandleHandlers("rota", idx)}
                          sx={{ color: "text.disabled", cursor: "grab" }}
                        />
                        <Typography color="text.secondary" sx={{ width: 56 }}>
                          Day {idx + 1}
                        </Typography>
                        <TextField
                          select
                          size="small"
                          value={dayById.has(dayId) ? dayId : ""}
                          onChange={(e) => setRotationStep(idx, e.target.value)}
                          sx={{ minWidth: 180 }}
                        >
                          {days.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                              {d.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton size="small" onClick={() => removeRotationStep(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

