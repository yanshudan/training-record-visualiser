// Typed loader for the standalone default-seed config
// (`config/training-defaults.json`). All actual default values live in that
// JSON file; the rest of the source references this typed view and never
// hardcodes seed values. To change the bundled defaults, edit the JSON only.

import rawConfig from "../../config/training-defaults.json";
import { OverloadRule, Unit } from "./schema";

export interface SeedTheme {
  inColor: string;
  outColor: string;
}

export interface SeedBodyPart {
  name: string;
  theme: SeedTheme;
  unit: Unit;
  defaults: { sets: number; reps: number; weight: number };
  overloadRules: OverloadRule[];
  exercises: string[];
}

/** A default training day, referencing the body parts whose exercises it holds. */
export interface SeedPlanDay {
  name: string;
  bodyParts: string[];
}

export interface SeedPlan {
  days: SeedPlanDay[];
  /** Ordered rotation by day name. */
  rotation: string[];
}

export interface SeedTimetableEntry {
  label: string;
  startMinute: number;
  endMinute: number;
  color: string;
}

export interface SeedConfig {
  fallbackTheme: SeedTheme;
  bodyParts: SeedBodyPart[];
  plan: SeedPlan;
  timetable: SeedTimetableEntry[];
}

// JSON literals widen string fields (e.g. `kind`, `unit`) to `string`, so we
// assert the richer config type here once. The JSON is the source of truth.
export const seedConfig = rawConfig as unknown as SeedConfig;
