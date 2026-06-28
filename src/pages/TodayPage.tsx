// Feature 1 — "Start your plan today".
// Generates today's target plan from history + overload rules, runs the workout
// with per-set and rest timers, lets you slide reps/weight when targets aren't
// met, add exercises in place, then saves the session as today's record.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import { useAppData } from "../state/AppDataContext";
import { DayPlan, generateDayPlan, generatePlanForDay, suggestRotationIndex } from "../domain/planGenerator";
import { bodyPartGradient, gradientTextColor } from "../data/bodyPartColors";
import { Movement, TrainingRecord, todayISO } from "../data/schema";
import { TimetablePage } from "./TimetablePage";

interface PlannedSet {
  weight: number;
  targetReps: number;
  reps: number;
  done: boolean;
  /** Extra drop/dual-set stages, performed within this single set. */
  drops: { weight: number; reps: number }[];
  workSeconds?: number;
  restSeconds?: number;
}

interface PlannedExercise {
  exerciseId: string;
  name: string;
  bodyPart: string;
  unit: string;
  sets: PlannedSet[];
}

interface ActivePos {
  ex: number;
  set: number;
  phase: "work" | "rest";
  startedAt: number;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Accent colour for the current set phase: working, resting, or stopped. */
function phaseColor(phase: "work" | "rest" | "stopped"): string {
  if (phase === "work") return "#ef6c00";
  if (phase === "rest") return "warning.main";
  return "text.disabled";
}

/**
 * Vertical "drum" picker for reps — scroll/flick up or down to snap to adjacent
 * numbers, iOS-passcode style. The centred number is the selected value.
 */
function RepWheel({
  value,
  onChange,
  max = 50,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const ITEM = 18; // px per number
  const H = ITEM * 3; // three visible rows (selected + one faded neighbour each side)
  const ref = useRef<HTMLDivElement | null>(null);
  const scrolling = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const items = useMemo(() => Array.from({ length: max + 1 }, (_, i) => i), [max]);

  // Keep the wheel positioned on `value` whenever it changes externally and the
  // user isn't mid-scroll (so we never fight their finger).
  useEffect(() => {
    const el = ref.current;
    if (!el || scrolling.current) return;
    const target = value * ITEM;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, [value]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    scrolling.current = true;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const idx = Math.max(0, Math.min(max, Math.round(el.scrollTop / ITEM)));
      scrolling.current = false;
      el.scrollTop = idx * ITEM; // re-snap exactly
      if (idx !== value) onChange(idx);
    }, 120);
  };

  return (
    <Box sx={{ position: "relative", width: 48, height: H, flexShrink: 0 }}>
      {/* highlight band marking the selected (middle) row */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ITEM,
          height: ITEM,
          borderTop: 1,
          borderBottom: 1,
          borderColor: "divider",
          pointerEvents: "none",
        }}
      />
      <Box
        ref={ref}
        onScroll={handleScroll}
        sx={{
          height: H,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          py: `${ITEM}px`,
          // Fade the top/bottom (adjacent) numbers so the wheel reads compact.
          maskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((n) => (
          <Box
            key={n}
            sx={{
              height: ITEM,
              scrollSnapAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontVariantNumeric: "tabular-nums",
              fontWeight: n === value ? 700 : 400,
              fontSize: n === value ? 15 : 12,
              color: n === value ? "text.primary" : "text.disabled",
              transition: "font-size 0.1s, color 0.1s",
            }}
          >
            {n}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Shared weight field + rep wheel, used by both normal sets and drop stages. */
function WeightReps({
  weight,
  reps,
  unit,
  onWeight,
  onReps,
}: {
  weight: number;
  reps: number;
  unit: string;
  onWeight: (v: number) => void;
  onReps: (v: number) => void;
}) {
  return (
    <>
      <TextField
        size="small"
        type="number"
        value={weight}
        onChange={(e) => onWeight(Number(e.target.value))}
        sx={{ width: 80, flexShrink: 0 }}
        InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
      />
      <RepWheel value={reps} onChange={onReps} />
    </>
  );
}

const TODAY_SESSION_KEY = "trv:todaySession";

interface PersistedSession {
  date: string;
  bodyPart: string;
  dayId: string;
  dayName: string;
  plan: PlannedExercise[];
  active: ActivePos | null;
  lastSetSeconds: number | null;
  lastRestSeconds: number | null;
  saved: boolean;
  expanded: Record<number, boolean>;
}

/** Load a same-day in-progress session from localStorage, if any. */
function loadTodaySession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(TODAY_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedSession;
    return s.date === todayISO() && Array.isArray(s.plan) && s.plan.length > 0 ? s : null;
  } catch {
    return null;
  }
}

export function TodayPage() {
  const { records, exercises, planDays, rotation, upsertRecord, colorForBodyPart } = useAppData();
  const mode = useTheme().palette.mode;

  // Restore an in-progress session (same day) so navigating away & back — or a
  // reload — doesn't lose the workout. The active timer uses absolute
  // timestamps, so elapsed time stays correct across reloads.
  const [persisted] = useState(loadTodaySession);

  const [view, setView] = useState<"plan" | "timetable">("plan");
  const [bodyPart, setBodyPart] = useState<string>(persisted?.bodyPart ?? "");
  const [dayId, setDayId] = useState<string>(persisted?.dayId ?? "");
  const [dayName, setDayName] = useState<string>(persisted?.dayName ?? "");
  const [plan, setPlan] = useState<PlannedExercise[]>(persisted?.plan ?? []);
  const [active, setActive] = useState<ActivePos | null>(persisted?.active ?? null);
  const [tick, setTick] = useState(0);
  const [lastSetSeconds, setLastSetSeconds] = useState<number | null>(persisted?.lastSetSeconds ?? null);
  const [lastRestSeconds, setLastRestSeconds] = useState<number | null>(persisted?.lastRestSeconds ?? null);
  const [saved, setSaved] = useState(persisted?.saved ?? false);
  // Manual fold overrides by exercise index; completed exercises fold by default.
  const [expanded, setExpanded] = useState<Record<number, boolean>>(persisted?.expanded ?? {});
  // Guards the auto-save so it fires at most once per generated plan.
  const autoSavedRef = useRef(persisted?.saved ?? false);

  // The next day in the rotation, derived from how many sessions are logged.
  const suggestedDayId = useMemo(() => {
    if (rotation.length === 0) return "";
    return rotation[suggestRotationIndex(records, rotation.length)] ?? "";
  }, [records, rotation]);

  const applyPlan = (dp: DayPlan) => {
    setBodyPart(dp.bodyPart);
    setPlan(
      dp.exercises.map((t) => {
        const def = exercises.find((e) => e.id === t.exerciseId);
        const stages = def?.dropStages ?? [];
        return {
          exerciseId: t.exerciseId,
          name: t.name,
          bodyPart: t.bodyPart,
          unit: t.unit,
          sets: t.sets.map((s) => ({
            weight: s.weight,
            targetReps: s.reps,
            reps: s.reps,
            done: false,
            drops: stages.map((st) => ({ weight: st.weight, reps: st.reps })),
          })),
        };
      })
    );
    setActive(null);
    setSaved(false);
    autoSavedRef.current = false;
  };

  const buildPlan = (part?: string) => {
    setDayId("");
    setDayName("");
    applyPlan(generateDayPlan(records, exercises, part));
  };

  const buildFromDay = (id: string) => {
    const day = planDays.find((d) => d.id === id);
    if (!day) return;
    setDayId(id);
    setDayName(day.name);
    applyPlan(generatePlanForDay(records, exercises, day));
  };

  // Generate the first plan once data is available: prefer the rotation's next
  // day, falling back to the most-overdue body part when no plan days exist.
  useEffect(() => {
    if (plan.length === 0 && exercises.length > 0) {
      if (suggestedDayId) buildFromDay(suggestedDayId);
      else buildPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, suggestedDayId]);

  // Ticking timer while a set/rest is active.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active ? Math.floor((Date.now() - active.startedAt) / 1000) : 0;
  void tick; // tick forces re-render so `elapsed` updates each second

  const updateSet = (ex: number, set: number, patch: Partial<PlannedSet>) => {
    setPlan((prev) =>
      prev.map((e, i) =>
        i === ex ? { ...e, sets: e.sets.map((s, j) => (j === set ? { ...s, ...patch } : s)) } : e
      )
    );
  };

  const startSet = (ex: number, set: number) => {
    setActive({ ex, set, phase: "work", startedAt: Date.now() });
  };

  const finishSet = () => {
    if (!active) return;
    setLastSetSeconds(elapsed);
    updateSet(active.ex, active.set, { done: true, workSeconds: elapsed });
    setActive({ ...active, phase: "rest", startedAt: Date.now() });
  };

  const startNext = () => {
    if (!active) return;
    setLastRestSeconds(elapsed);
    updateSet(active.ex, active.set, { restSeconds: elapsed });
    const exercise = plan[active.ex];
    if (active.set + 1 < exercise.sets.length) {
      startSet(active.ex, active.set + 1);
    } else if (active.ex + 1 < plan.length) {
      startSet(active.ex + 1, 0);
    } else {
      setActive(null);
    }
  };

  const addSet = (ex: number) => {
    setPlan((prev) =>
      prev.map((e, i) => {
        if (i !== ex) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { ...last, done: false }] };
      })
    );
  };

  // Remove a specific set (keeping at least one), reconciling the active timer.
  const removeSetAt = (ex: number, set: number) => {
    setPlan((prev) =>
      prev.map((e, i) => (i === ex && e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, j) => j !== set) } : e))
    );
    setActive((a) => {
      if (!a || a.ex !== ex) return a;
      if (a.set === set) return null; // the active set itself was removed
      if (a.set > set) return { ...a, set: a.set - 1 }; // shift to follow the move
      return a;
    });
  };

  // --- Drop/dual-set stages within a single set ------------------------------
  const addDrop = (ex: number, set: number) => {
    setPlan((prev) =>
      prev.map((e, i) =>
        i !== ex
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j !== set ? s : { ...s, drops: [...s.drops, { weight: s.weight, reps: s.reps }] }
              ),
            }
      )
    );
  };

  const updateDrop = (ex: number, set: number, drop: number, patch: Partial<{ weight: number; reps: number }>) => {
    setPlan((prev) =>
      prev.map((e, i) =>
        i !== ex
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j !== set
                  ? s
                  : { ...s, drops: s.drops.map((d, k) => (k === drop ? { ...d, ...patch } : d)) }
              ),
            }
      )
    );
  };

  const removeDrop = (ex: number, set: number, drop: number) => {
    setPlan((prev) =>
      prev.map((e, i) =>
        i !== ex
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j !== set ? s : { ...s, drops: s.drops.filter((_, k) => k !== drop) }
              ),
            }
      )
    );
  };

  const removeExercise = (ex: number) => setPlan((prev) => prev.filter((_, i) => i !== ex));

  const addExercise = (name: string) => {
    const def = exercises.find((e) => e.name === name);
    const last = def ? generateDayPlan(records, [def], def.bodyPart).exercises[0] : undefined;
    setPlan((prev) => [
      ...prev,
      {
        exerciseId: def?.id ?? name,
        name,
        bodyPart: def?.bodyPart ?? bodyPart,
        unit: def?.unit ?? "kg",
        sets: (last?.sets ?? [{ weight: 20, reps: 12, unit: "kg" as const }]).map((s) => ({
          weight: s.weight,
          targetReps: s.reps,
          reps: s.reps,
          done: false,
          drops: (def?.dropStages ?? []).map((st) => ({ weight: st.weight, reps: st.reps })),
        })),
      },
    ]);
  };

  const saveSession = async () => {
    const movements: Movement[] = plan
      .map((e) => ({
        name: e.name,
        comment: "",
        sets: e.sets
          .filter((s) => s.done || s.reps > 0)
          .map((s) => ({
            weight: s.weight,
            unit: e.unit as Movement["sets"][number]["unit"],
            reps: s.reps,
            stages: s.drops.length ? s.drops.map((d) => ({ weight: d.weight, reps: d.reps })) : undefined,
            workSeconds: s.workSeconds,
            restSeconds: s.restSeconds,
          })),
      }))
      .filter((m) => m.sets.length > 0);
    const record: TrainingRecord = {
      date: todayISO(),
      topic: bodyPart || "General",
      comment: "",
      movements,
    };
    await upsertRecord(record);
    setSaved(true);
  };

  // Auto-save once every exercise is fully completed, so finishing the last set
  // records the session without an extra tap.
  useEffect(() => {
    if (saved || autoSavedRef.current || plan.length === 0) return;
    const allDone = plan.every((e) => e.sets.length > 0 && e.sets.every((s) => s.done));
    if (allDone) {
      autoSavedRef.current = true;
      void saveSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, saved]);

  // Persist the in-progress session so it survives navigation away/back & reload.
  useEffect(() => {
    if (plan.length === 0) return;
    const session: PersistedSession = {
      date: todayISO(),
      bodyPart,
      dayId,
      dayName,
      plan,
      active,
      lastSetSeconds,
      lastRestSeconds,
      saved,
      expanded,
    };
    try {
      localStorage.setItem(TODAY_SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [plan, active, bodyPart, dayId, dayName, lastSetSeconds, lastRestSeconds, saved, expanded]);

  const dayColor = bodyPart ? colorForBodyPart(bodyPart) : undefined;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Today
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="plan">Plan</ToggleButton>
          <ToggleButton value="timetable">Timetable</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {view === "timetable" && <TimetablePage />}

      {view === "plan" && (
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              <Box component="span" sx={{ color: dayColor }}>
                {dayName || bodyPart || "Plan"}
              </Box>
            </Typography>
            {planDays.length > 0 && (
              <TextField
                select
                size="small"
                label="Training day"
                value={dayId}
                onChange={(e) => buildFromDay(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                {planDays.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.id === suggestedDayId ? `${d.name} (next)` : d.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

      {/* Active timer panel */}
      {active && (
        <Card sx={{ borderLeft: 4, borderColor: phaseColor(active.phase) }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: phaseColor(active.phase) }}>
              {active.phase === "work" ? "Working set" : "Rest"} · {plan[active.ex]?.name} · set {active.set + 1}
            </Typography>
            <Typography variant="h2" sx={{ fontVariantNumeric: "tabular-nums", color: phaseColor(active.phase) }}>
              {fmt(elapsed)}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {active.phase === "work" ? (
                <Button variant="contained" color="warning" startIcon={<CheckIcon />} onClick={finishSet}>
                  Finish set
                </Button>
              ) : (
                <Button variant="contained" color="warning" startIcon={<PlayArrowIcon />} onClick={startNext}>
                  Start next set
                </Button>
              )}
              <Button color="inherit" onClick={() => setActive(null)}>
                Stop
              </Button>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }} color="text.secondary">
              {lastSetSeconds !== null && <Typography variant="caption">Last set: {fmt(lastSetSeconds)}</Typography>}
              {lastRestSeconds !== null && <Typography variant="caption">Last rest: {fmt(lastRestSeconds)}</Typography>}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Exercise plan */}
      {plan.map((exercise, exIdx) => {
        const exDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.done);
        const hasActive = active?.ex === exIdx;
        const isExpanded = expanded[exIdx] ?? !exDone;
        const doneCount = exercise.sets.filter((s) => s.done).length;
        return (
          <Card
            key={`${exercise.name}-${exIdx}`}
            sx={hasActive ? { borderLeft: 4, borderColor: phaseColor(active.phase) } : undefined}
          >
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={() => setExpanded((p) => ({ ...p, [exIdx]: !isExpanded }))}
                sx={{ cursor: "pointer" }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, flexGrow: 1, color: exDone ? "text.secondary" : "text.primary" }}
                >
                  {exercise.name}
                </Typography>
                {exDone && <Chip size="small" color="warning" icon={<CheckCircleIcon />} label="Done" />}
                {!exDone && exercise.sets.length > 0 && (
                  <Chip size="small" variant="outlined" label={`${doneCount}/${exercise.sets.length}`} />
                )}
                <Chip size="small" label={exercise.bodyPart} sx={{ background: bodyPartGradient(colorForBodyPart(exercise.bodyPart), mode), color: gradientTextColor(colorForBodyPart(exercise.bodyPart), mode), fontWeight: 600 }} />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExercise(exIdx);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <ExpandMoreIcon
                  sx={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "text.secondary" }}
                />
              </Stack>
              <Collapse in={isExpanded} unmountOnExit>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.5}>
                  {exercise.sets.map((set, setIdx) => {
                    const isActive = active?.ex === exIdx && active?.set === setIdx;
                    const missed = set.done && set.reps < set.targetReps;
                    return (
                      <Box
                        key={setIdx}
                        sx={{
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.25,
                          bgcolor: isActive
                            ? "rgba(255, 167, 38, 0.18)"
                            : set.done
                              ? "rgba(255, 152, 0, 0.40)"
                              : "transparent",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" sx={{ width: 28, flexShrink: 0 }} color="text.secondary">
                          #{setIdx + 1}
                        </Typography>
                        <WeightReps
                          weight={set.weight}
                          reps={set.reps}
                          unit={exercise.unit}
                          onWeight={(v) => updateSet(exIdx, setIdx, { weight: v })}
                          onReps={(v) => updateSet(exIdx, setIdx, { reps: v })}
                        />
                        <Stack sx={{ flexShrink: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.15 }}>
                            reps
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ lineHeight: 1.15 }}
                            color={missed ? "warning.main" : "text.secondary"}
                          >
                            /{set.targetReps}
                          </Typography>
                        </Stack>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ width: 72, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                          {isActive ? (
                            <Chip
                              size="small"
                              color={active.phase === "work" ? "warning" : "info"}
                              label={active.phase === "work" ? "working" : "resting"}
                            />
                          ) : set.done ? (
                            <CheckIcon sx={{ color: missed ? "warning.main" : "#ef6c00" }} />
                          ) : !active ? (
                            <IconButton color="primary" size="small" onClick={() => startSet(exIdx, setIdx)}>
                              <PlayArrowIcon />
                            </IconButton>
                          ) : null}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeSetAt(exIdx, setIdx)}
                          disabled={exercise.sets.length <= 1}
                          sx={{ color: "text.disabled", flexShrink: 0 }}
                          aria-label="Remove this set"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        </Stack>
                        {/* Drop/dual-set stages performed within this single set */}
                        <Stack spacing={0.5} sx={{ pl: 4, mt: set.drops.length ? 0.5 : 0 }}>
                          {set.drops.map((drop, dropIdx) => (
                            <Stack key={dropIdx} direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="caption" sx={{ width: 24, flexShrink: 0 }} color="text.secondary">
                                ↳{dropIdx + 2}
                              </Typography>
                              <WeightReps
                                weight={drop.weight}
                                reps={drop.reps}
                                unit={exercise.unit}
                                onWeight={(v) => updateDrop(exIdx, setIdx, dropIdx, { weight: v })}
                                onReps={(v) => updateDrop(exIdx, setIdx, dropIdx, { reps: v })}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                reps
                              </Typography>
                              <Box sx={{ flexGrow: 1 }} />
                              <IconButton
                                size="small"
                                onClick={() => removeDrop(exIdx, setIdx, dropIdx)}
                                sx={{ color: "text.disabled" }}
                                aria-label="Remove this drop stage"
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                          <Box>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addDrop(exIdx, setIdx)}
                              sx={{ color: "text.secondary" }}
                            >
                              Add drop
                            </Button>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addSet(exIdx)}>
                    Add set
                  </Button>
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      {/* Add exercise in place */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Add exercise
          </Typography>
          <Autocomplete
            freeSolo
            options={exercises.map((e) => e.name)}
            onChange={(_, value) => value && addExercise(value)}
            renderInput={(params) => <TextField {...params} size="small" label="Search or type a new exercise" />}
          />
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={saveSession} disabled={plan.length === 0}>
          Save today's session
        </Button>
        {saved && <Chip color="primary" label="Saved" />}
      </Stack>
        </Stack>
      )}
    </Stack>
  );
}
