// Body-part themes/grouping and the seed exercise list. All actual values come
// from the standalone config (`config/training-defaults.json`) via `seedConfig`;
// this module only derives lookup tables and builders from that data.

import { ExerciseDef, makeId, Unit } from "./schema";
import { seedConfig } from "./seedConfig";

export interface BodyPartTheme {
  inColor: string;
  outColor: string;
}

export interface BodyPartSeed {
  exercises: string[];
  theme: BodyPartTheme;
  unit?: Unit;
}

export const bodyPartDefinitions = new Map<string, BodyPartSeed>(
  seedConfig.bodyParts.map((bp) => [bp.name, { exercises: bp.exercises, theme: bp.theme, unit: bp.unit }])
);

export const bodyPartOrder: string[] = seedConfig.bodyParts.map((bp) => bp.name);

export const movementToPart = new Map<string, string>(
  seedConfig.bodyParts.flatMap((bp) => bp.exercises.map((m) => [m, bp.name] as [string, string]))
);

export function themeForBodyPart(part: string): BodyPartTheme {
  return bodyPartDefinitions.get(part)?.theme ?? seedConfig.fallbackTheme;
}

export function detectBodyPart(movementName: string): string {
  return movementToPart.get(movementName) ?? "Other";
}

/** Build the default exercise definitions from the standalone seed config. */
export function seedExerciseDefs(): ExerciseDef[] {
  const defs: ExerciseDef[] = [];
  for (const bp of seedConfig.bodyParts) {
    for (const name of bp.exercises) {
      defs.push({
        id: makeId("ex"),
        name,
        bodyPart: bp.name,
        unit: bp.unit,
        defaultSets: bp.defaults.sets,
        defaultReps: bp.defaults.reps,
        defaultWeight: bp.defaults.weight,
        overloadRules: bp.overloadRules.map((r) => ({ ...r })),
      });
    }
  }
  return defs;
}
