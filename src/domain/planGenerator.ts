// Generates "today's plan" from training history. Picks the body part that is
// most overdue (least recently trained) and computes progressive-overload
// targets for each of its exercises that has history (plus seeded defaults).

import { ExerciseDef, PlanDay, TrainingRecord } from "../data/schema";
import { computeNextTarget, ExerciseTarget, lastPerformance } from "./progressiveOverload";

export interface DayPlan {
  bodyPart: string;
  exercises: ExerciseTarget[];
}

/** Most recent training date (ISO) for each body part. */
export function lastTrainedByBodyPart(
  records: TrainingRecord[],
  exercises: ExerciseDef[]
): Map<string, string> {
  const nameToPart = new Map(exercises.map((e) => [e.name, e.bodyPart]));
  const result = new Map<string, string>();
  for (const record of records) {
    for (const movement of record.movements) {
      const part = nameToPart.get(movement.name) ?? record.topic;
      const prev = result.get(part);
      if (!prev || prev < record.date) result.set(part, record.date);
    }
  }
  return result;
}

/** Choose the body part to train: the one not trained for the longest. */
export function suggestBodyPart(records: TrainingRecord[], exercises: ExerciseDef[]): string {
  const parts = [...new Set(exercises.map((e) => e.bodyPart))].filter((p) => p !== "Cardio");
  if (parts.length === 0) return "General";
  const lastTrained = lastTrainedByBodyPart(records, exercises);
  return parts
    .map((part) => ({ part, last: lastTrained.get(part) ?? "0000-00-00" }))
    .sort((a, b) => (a.last < b.last ? -1 : 1))[0].part;
}

export function generateDayPlan(
  records: TrainingRecord[],
  exercises: ExerciseDef[],
  bodyPart?: string
): DayPlan {
  const part = bodyPart ?? suggestBodyPart(records, exercises);
  const partExercises = exercises.filter((e) => e.bodyPart === part);
  const targets = partExercises.map((def) =>
    computeNextTarget(def, lastPerformance(records, def.name))
  );
  return { bodyPart: part, exercises: targets };
}

/** The body part that appears most often across a set of targets (for theming). */
export function headlineBodyPart(targets: ExerciseTarget[]): string | undefined {
  const counts = new Map<string, number>();
  for (const t of targets) counts.set(t.bodyPart, (counts.get(t.bodyPart) ?? 0) + 1);
  let best: string | undefined;
  let bestCount = 0;
  for (const [part, count] of counts) {
    if (count > bestCount) {
      best = part;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Build targets for a specific training day: its exercises, in order, each with
 * progressive-overload applied from history. Exercise ids that no longer resolve
 * to a definition are skipped.
 */
export function generatePlanForDay(
  records: TrainingRecord[],
  exercises: ExerciseDef[],
  day: PlanDay
): DayPlan {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const targets = day.exerciseIds
    .map((id) => byId.get(id))
    .filter((def): def is ExerciseDef => Boolean(def))
    .map((def) => computeNextTarget(def, lastPerformance(records, def.name)));
  return { bodyPart: headlineBodyPart(targets) ?? day.name, exercises: targets };
}

/**
 * Suggest where in the rotation the user is, based on how many sessions they
 * have logged. With an empty history this points at the first rotation step.
 */
export function suggestRotationIndex(records: TrainingRecord[], rotationLength: number): number {
  if (rotationLength <= 0) return 0;
  return records.length % rotationLength;
}
