// ---------------------------------------------------------------------------
// v2 data schema (multi-user). Every stored blob carries `schemaVersion` so we
// can migrate forward safely. Each user owns a set of JSON blobs stored under
// `users/{userId}/...`. `records.json` is the full accumulating history and is
// fully overwritten on every save (Azure blob versioning protects old copies).
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = 3;

export type Unit = "kg" | "lb" | "km" | "bpm" | "min";

export interface TrainSet {
  weight: number;
  unit: Unit;
  reps: number;
  /**
   * Extra drop/dual-set stages performed back-to-back after the main
   * weight/reps, counted as part of THIS single set (so a dual set = 1 extra
   * stage, a triple = 2). Absent for a normal single-weight set.
   */
  stages?: { weight: number; reps: number }[];
  /** Seconds spent performing the set (work timer). */
  workSeconds?: number;
  /** Seconds rested after the set before the next one (rest timer). */
  restSeconds?: number;
}

export interface Movement {
  /** Exercise name; should match an ExerciseDef.name when known. */
  name: string;
  sets: TrainSet[];
  comment: string;
}

export interface TrainingRecord {
  /** ISO date, `YYYY-MM-DD`. Unique per user. */
  date: string;
  /** Primary body part / session topic, e.g. "Chest". */
  topic: string;
  comment: string;
  movements: Movement[];
}

/** Full accumulating training history blob. */
export interface RecordsDoc {
  schemaVersion: number;
  records: TrainingRecord[];
}

// --- Exercise definitions & progressive overload configuration ---------------

export type OverloadRuleKind = "addReps" | "addWeight";

/**
 * A progressive-overload rule. Rules are evaluated against the last performance
 * of an exercise to produce the next target.
 * - addReps: add `amount` reps to the per-set target.
 * - addWeight: if last session hit `whenRepsAtLeast` reps on every working set,
 *   add `amount` (kg/lb) and reset reps to `resetRepsTo`.
 */
export interface OverloadRule {
  kind: OverloadRuleKind;
  amount: number;
  whenRepsAtLeast?: number;
  resetRepsTo?: number;
}

export interface ExerciseDef {
  id: string;
  name: string;
  bodyPart: string;
  unit: Unit;
  /** Default working-set template used when seeding a new plan. */
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  /**
   * Extra drop/dual-set stages per working set, each with its own weight and
   * starting reps (performed back-to-back after the main weight/reps within the
   * SAME set). Length 1 = dual set, 2 = triple set. Empty/undefined = normal
   * single set. The set count is shared with the main set (not configured here).
   */
  dropStages?: { weight: number; reps: number }[];
  overloadRules: OverloadRule[];
}

export interface ExercisesDoc {
  schemaVersion: number;
  exercises: ExerciseDef[];
  /** Optional ordering of body parts for display. */
  bodyParts: string[];
  /** User-customised colour per body part (name -> hex). Optional. */
  bodyPartColors?: Record<string, string>;
}

// --- Daily timetable ---------------------------------------------------------

export interface TimetableEntry {
  id: string;
  label: string;
  /** Minutes from midnight, 0..1439. */
  startMinute: number;
  endMinute: number;
  color: string;
}

export interface TimetableDoc {
  schemaVersion: number;
  entries: TimetableEntry[];
}

// --- Training plan (days + rotation) -----------------------------------------

/**
 * A single training day: an ordered list of exercises to perform. Exercises are
 * referenced by `ExerciseDef.id` so renaming an exercise keeps the day intact.
 */
export interface PlanDay {
  id: string;
  name: string;
  /** Ordered references to `ExerciseDef.id`. */
  exerciseIds: string[];
}

/**
 * The user's training plan. `days` are reusable building blocks; `rotation` is
 * the ordered loop the user cycles through, e.g. day1, day2, day1, day2, day3.
 * Rotation entries are `PlanDay.id`s and may repeat.
 */
export interface PlanDoc {
  schemaVersion: number;
  days: PlanDay[];
  rotation: string[];
}

// --- Helpers -----------------------------------------------------------------

export function emptyRecordsDoc(): RecordsDoc {
  return { schemaVersion: SCHEMA_VERSION, records: [] };
}

export function emptyExercisesDoc(): ExercisesDoc {
  return { schemaVersion: SCHEMA_VERSION, exercises: [], bodyParts: [], bodyPartColors: {} };
}

export function emptyTimetableDoc(): TimetableDoc {
  return { schemaVersion: SCHEMA_VERSION, entries: [] };
}

export function emptyPlanDoc(): PlanDoc {
  return { schemaVersion: SCHEMA_VERSION, days: [], rotation: [] };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

let idCounter = 0;
export function makeId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}
