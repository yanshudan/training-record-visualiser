// One-time, idempotent migrations that run on load. Brings v0.1 data forward:
//  - Legacy plain-text records in localStorage["trainingRecords"] -> records.json
//  - Seeds default exercise definitions if none exist yet.
// Safe to run repeatedly: it only writes when the target document is absent.

import { StorageProvider } from "../storage/StorageProvider";
import { seedExerciseDefs, bodyPartOrder } from "./bodyParts";
import { seedConfig } from "./seedConfig";
import { parseLegacyRecords } from "./legacySerializer";
import {
  emptyExercisesDoc,
  emptyRecordsDoc,
  ExercisesDoc,
  makeId,
  PlanDay,
  PlanDoc,
  RecordsDoc,
  SCHEMA_VERSION,
  TimetableDoc,
  TimetableEntry,
} from "./schema";

const LEGACY_KEY = "trainingRecords";
const MIGRATION_FLAG = "trv:legacyMigrated";

export interface MigrationResult {
  migratedLegacyRecords: number;
  seededExercises: boolean;
  seededPlan: boolean;
  seededTimetable: boolean;
}

export async function runMigrations(provider: StorageProvider): Promise<MigrationResult> {
  const result: MigrationResult = {
    migratedLegacyRecords: 0,
    seededExercises: false,
    seededPlan: false,
    seededTimetable: false,
  };

  // --- Records: migrate legacy plain-text if no v2 records exist yet ----------
  const existingRecords = await provider.read<RecordsDoc>("records.json");
  if (!existingRecords && localStorage.getItem(MIGRATION_FLAG) !== "done") {
    const legacyText = localStorage.getItem(LEGACY_KEY);
    if (legacyText) {
      const records = parseLegacyRecords(legacyText);
      const doc: RecordsDoc = { schemaVersion: SCHEMA_VERSION, records };
      await provider.write("records.json", doc);
      result.migratedLegacyRecords = records.length;
    } else {
      await provider.write("records.json", emptyRecordsDoc());
    }
    localStorage.setItem(MIGRATION_FLAG, "done");
  }

  // --- Exercises: seed defaults if missing ------------------------------------
  const existingExercises = await provider.read<ExercisesDoc>("exercises.json");
  if (!existingExercises) {
    const doc: ExercisesDoc = {
      ...emptyExercisesDoc(),
      exercises: seedExerciseDefs(),
      bodyParts: [...bodyPartOrder],
    };
    await provider.write("exercises.json", doc);
    result.seededExercises = true;
  } else if (existingExercises.data.bodyPartColors === undefined) {
    // v2 -> v3: introduce per-body-part colours (default palette is applied at
    // render time, so an empty map is sufficient). Idempotent: once the field
    // exists this branch is skipped.
    const upgraded: ExercisesDoc = {
      ...existingExercises.data,
      schemaVersion: SCHEMA_VERSION,
      bodyPartColors: {},
    };
    await provider.write("exercises.json", upgraded, existingExercises.etag);
  }

  // --- Plan: seed default training days + rotation if missing -----------------
  // Days and rotation come from the standalone config; each config day collects
  // the exercises whose body part it lists. Users reshape this on the Plan page.
  const existingPlan = await provider.read<PlanDoc>("plan.json");
  if (!existingPlan) {
    const exDoc = await provider.read<ExercisesDoc>("exercises.json");
    const defs = exDoc?.data.exercises ?? [];
    const dayIdByName = new Map<string, string>();
    const days: PlanDay[] = seedConfig.plan.days.map((day) => {
      const id = makeId("day");
      dayIdByName.set(day.name, id);
      const exerciseIds = defs.filter((e) => day.bodyParts.includes(e.bodyPart)).map((e) => e.id);
      return { id, name: day.name, exerciseIds };
    });
    const rotation = seedConfig.plan.rotation
      .map((name) => dayIdByName.get(name))
      .filter((id): id is string => Boolean(id));
    const doc: PlanDoc = { schemaVersion: SCHEMA_VERSION, days, rotation };
    await provider.write("plan.json", doc);
    result.seededPlan = true;
  }

  // --- Timetable: seed default entries from config if missing -----------------
  const existingTimetable = await provider.read<TimetableDoc>("timetable.json");
  if (!existingTimetable) {
    const entries: TimetableEntry[] = seedConfig.timetable.map((e) => ({
      id: makeId("tt"),
      label: e.label,
      startMinute: e.startMinute,
      endMinute: e.endMinute,
      color: e.color,
    }));
    await provider.write("timetable.json", { schemaVersion: SCHEMA_VERSION, entries });
    result.seededTimetable = true;
  }

  return result;
}
