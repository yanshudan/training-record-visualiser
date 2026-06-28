// Central app data store. Loads the three per-user documents (records,
// exercises, timetable), runs migrations, and exposes save helpers that persist
// full-overwrite documents with optimistic-concurrency etags.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { runMigrations } from "../data/migration";
import {
  emptyExercisesDoc,
  emptyPlanDoc,
  emptyRecordsDoc,
  emptyTimetableDoc,
  ExerciseDef,
  ExercisesDoc,
  PlanDay,
  PlanDoc,
  RecordsDoc,
  SCHEMA_VERSION,
  TimetableDoc,
  TimetableEntry,
  TrainingRecord,
} from "../data/schema";
import { createStorageProvider, loadStorageSettings } from "../storage/storageFactory";
import { ConcurrencyError, StorageProvider } from "../storage/StorageProvider";
import { resolveBodyPartColor } from "../data/bodyPartColors";

interface AppDataValue {
  loading: boolean;
  error?: string;
  records: TrainingRecord[];
  exercises: ExerciseDef[];
  bodyParts: string[];
  bodyPartColors: Record<string, string>;
  /** Resolve the display colour for a body part (override or default palette). */
  colorForBodyPart: (part: string) => string;
  timetable: TimetableEntry[];
  planDays: PlanDay[];
  rotation: string[];
  reload: () => Promise<void>;
  upsertRecord: (record: TrainingRecord) => Promise<void>;
  deleteRecord: (date: string) => Promise<void>;
  saveExercises: (
    exercises: ExerciseDef[],
    bodyParts?: string[],
    bodyPartColors?: Record<string, string>
  ) => Promise<void>;
  saveTimetable: (entries: TimetableEntry[]) => Promise<void>;
  savePlan: (days: PlanDay[], rotation: string[]) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { profile, getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [recordsDoc, setRecordsDoc] = useState<RecordsDoc>(emptyRecordsDoc());
  const [exercisesDoc, setExercisesDoc] = useState<ExercisesDoc>(emptyExercisesDoc());
  const [timetableDoc, setTimetableDoc] = useState<TimetableDoc>(emptyTimetableDoc());
  const [planDoc, setPlanDoc] = useState<PlanDoc>(emptyPlanDoc());

  // etags for optimistic concurrency, by logical key.
  const etags = useRef<Record<string, string | undefined>>({});

  const providerRef = useRef<StorageProvider | null>(null);
  const buildProvider = useCallback((): StorageProvider => {
    return createStorageProvider({
      settings: loadStorageSettings(),
      userId: profile.userId,
      getToken,
    });
  }, [profile.userId, getToken]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const provider = buildProvider();
      providerRef.current = provider;
      await runMigrations(provider);

      const [rec, ex, tt, plan] = await Promise.all([
        provider.read<RecordsDoc>("records.json"),
        provider.read<ExercisesDoc>("exercises.json"),
        provider.read<TimetableDoc>("timetable.json"),
        provider.read<PlanDoc>("plan.json"),
      ]);

      etags.current = {
        "records.json": rec?.etag,
        "exercises.json": ex?.etag,
        "timetable.json": tt?.etag,
        "plan.json": plan?.etag,
      };
      setRecordsDoc(rec?.data ?? emptyRecordsDoc());
      setExercisesDoc(ex?.data ?? emptyExercisesDoc());
      setTimetableDoc(tt?.data ?? emptyTimetableDoc());
      setPlanDoc(plan?.data ?? emptyPlanDoc());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [buildProvider]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async <T,>(key: string, data: T): Promise<void> => {
      const provider = providerRef.current ?? buildProvider();
      providerRef.current = provider;
      try {
        const res = await provider.write(key, data, etags.current[key]);
        etags.current[key] = res.etag;
      } catch (e) {
        if (e instanceof ConcurrencyError) {
          // Someone else wrote a newer copy: reload then surface for retry.
          await load();
          throw e;
        }
        throw e;
      }
    },
    [buildProvider, load]
  );

  const upsertRecord = useCallback(
    async (record: TrainingRecord) => {
      const others = recordsDoc.records.filter((r) => r.date !== record.date);
      const next: RecordsDoc = {
        schemaVersion: SCHEMA_VERSION,
        records: [...others, record].sort((a, b) => (a.date < b.date ? 1 : -1)),
      };
      setRecordsDoc(next);
      await persist("records.json", next);
    },
    [recordsDoc, persist]
  );

  const deleteRecord = useCallback(
    async (date: string) => {
      const next: RecordsDoc = {
        schemaVersion: SCHEMA_VERSION,
        records: recordsDoc.records.filter((r) => r.date !== date),
      };
      setRecordsDoc(next);
      await persist("records.json", next);
    },
    [recordsDoc, persist]
  );

  const saveExercises = useCallback(
    async (exercises: ExerciseDef[], bodyParts?: string[], bodyPartColors?: Record<string, string>) => {
      const next: ExercisesDoc = {
        schemaVersion: SCHEMA_VERSION,
        exercises,
        bodyParts: bodyParts ?? exercisesDoc.bodyParts,
        bodyPartColors: bodyPartColors ?? exercisesDoc.bodyPartColors ?? {},
      };
      setExercisesDoc(next);
      await persist("exercises.json", next);
    },
    [exercisesDoc, persist]
  );

  const saveTimetable = useCallback(
    async (entries: TimetableEntry[]) => {
      const next: TimetableDoc = { schemaVersion: SCHEMA_VERSION, entries };
      setTimetableDoc(next);
      await persist("timetable.json", next);
    },
    [persist]
  );

  const savePlan = useCallback(
    async (days: PlanDay[], rotation: string[]) => {
      const next: PlanDoc = { schemaVersion: SCHEMA_VERSION, days, rotation };
      setPlanDoc(next);
      await persist("plan.json", next);
    },
    [persist]
  );

  const colorForBodyPart = useCallback(
    (part: string) =>
      resolveBodyPartColor(part, exercisesDoc.bodyParts, exercisesDoc.bodyPartColors),
    [exercisesDoc.bodyParts, exercisesDoc.bodyPartColors]
  );

  const value = useMemo<AppDataValue>(
    () => ({
      loading,
      error,
      records: recordsDoc.records,
      exercises: exercisesDoc.exercises,
      bodyParts: exercisesDoc.bodyParts,
      bodyPartColors: exercisesDoc.bodyPartColors ?? {},
      colorForBodyPart,
      timetable: timetableDoc.entries,
      planDays: planDoc.days,
      rotation: planDoc.rotation,
      reload: load,
      upsertRecord,
      deleteRecord,
      saveExercises,
      saveTimetable,
      savePlan,
    }),
    [loading, error, recordsDoc, exercisesDoc, timetableDoc, planDoc, colorForBodyPart, load, upsertRecord, deleteRecord, saveExercises, saveTimetable, savePlan]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
