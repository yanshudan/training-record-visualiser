// Progressive-overload engine. Given an exercise definition and its most recent
// performance, compute the next session's target sets by applying the exercise's
// ordered overload rules.

import { ExerciseDef, Movement, TrainingRecord, Unit } from "../data/schema";

export interface TargetSet {
  weight: number;
  reps: number;
  unit: Unit;
}

export interface ExerciseTarget {
  exerciseId: string;
  name: string;
  bodyPart: string;
  unit: Unit;
  sets: TargetSet[];
  /** True when the weight was bumped this session (ceiling reached last time). */
  weightProgressed: boolean;
}

/** Find the most recent logged performance of an exercise across all records. */
export function lastPerformance(records: TrainingRecord[], exerciseName: string): Movement | undefined {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const record of sorted) {
    const movement = record.movements.find((m) => m.name === exerciseName && m.sets.length > 0);
    if (movement) return movement;
  }
  return undefined;
}

export function computeNextTarget(def: ExerciseDef, last?: Movement): ExerciseTarget {
  const setCount = last?.sets.length || def.defaultSets || 1;

  if (!last || last.sets.length === 0) {
    return {
      exerciseId: def.id,
      name: def.name,
      bodyPart: def.bodyPart,
      unit: def.unit,
      weightProgressed: false,
      sets: Array.from({ length: setCount }, () => ({
        weight: def.defaultWeight,
        reps: def.defaultReps,
        unit: def.unit,
      })),
    };
  }

  const workingSets = last.sets;
  const baseWeight = Math.max(...workingSets.map((s) => s.weight));
  const minReps = Math.min(...workingSets.map((s) => s.reps));

  let weight = baseWeight;
  let reps = minReps;
  let weightProgressed = false;

  for (const rule of def.overloadRules) {
    if (rule.kind === "addWeight") {
      const threshold = rule.whenRepsAtLeast ?? Infinity;
      const allHit = workingSets.every((s) => s.reps >= threshold);
      if (allHit) {
        weight = baseWeight + rule.amount;
        reps = rule.resetRepsTo ?? minReps;
        weightProgressed = true;
        break;
      }
    }
  }

  if (!weightProgressed) {
    for (const rule of def.overloadRules) {
      if (rule.kind === "addReps") reps += rule.amount;
    }
  }

  return {
    exerciseId: def.id,
    name: def.name,
    bodyPart: def.bodyPart,
    unit: def.unit,
    weightProgressed,
    sets: Array.from({ length: setCount }, () => ({ weight, reps, unit: def.unit })),
  };
}
