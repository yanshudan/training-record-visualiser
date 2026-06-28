// Aggregations for the visualisation page. Everything is computed from the
// user's records and their exercise definitions, so charts always reflect the
// user's own body-part mapping.

import { ExerciseDef, Movement, TrainingRecord } from "../data/schema";

export function setVolume(weight: number, reps: number): number {
  return Math.max(weight, 0) * Math.max(reps, 0);
}

export function movementVolume(movement: Movement): number {
  return movement.sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0);
}

/** Epley estimated 1-rep max for a set. */
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function nameToPartMap(exercises: ExerciseDef[]): Map<string, string> {
  return new Map(exercises.map((e) => [e.name, e.bodyPart]));
}

export interface VolumePoint {
  date: string;
  [bodyPart: string]: number | string;
}

/** Daily training volume split by body part, for a stacked area/bar chart. */
export function volumeByBodyPart(
  records: TrainingRecord[],
  exercises: ExerciseDef[]
): { points: VolumePoint[]; parts: string[] } {
  const nameToPart = nameToPartMap(exercises);
  const partSet = new Set<string>();
  const byDate = new Map<string, Record<string, number>>();

  for (const record of [...records].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const row = byDate.get(record.date) ?? {};
    for (const movement of record.movements) {
      const part = nameToPart.get(movement.name) ?? record.topic ?? "Other";
      partSet.add(part);
      row[part] = (row[part] ?? 0) + movementVolume(movement);
    }
    byDate.set(record.date, row);
  }

  const parts = [...partSet];
  const points: VolumePoint[] = [...byDate.entries()].map(([date, row]) => {
    const point: VolumePoint = { date };
    for (const part of parts) point[part] = Math.round(row[part] ?? 0);
    return point;
  });
  return { points, parts };
}

export interface ProgressionPoint {
  date: string;
  topWeight: number;
  est1RM: number;
  volume: number;
}

/** Progression of a single exercise over time. */
export function exerciseProgression(
  records: TrainingRecord[],
  exerciseName: string
): ProgressionPoint[] {
  const points: ProgressionPoint[] = [];
  for (const record of [...records].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const movement = record.movements.find((m) => m.name === exerciseName && m.sets.length > 0);
    if (!movement) continue;
    const topWeight = Math.max(...movement.sets.map((s) => s.weight));
    const best1RM = Math.max(...movement.sets.map((s) => estimated1RM(s.weight, s.reps)));
    points.push({
      date: record.date,
      topWeight,
      est1RM: Math.round(best1RM * 10) / 10,
      volume: Math.round(movementVolume(movement)),
    });
  }
  return points;
}

export interface BodyPartFrequency {
  bodyPart: string;
  sessions: number;
  volume: number;
}

/** Total sets trained per ISO date — drives the daily training heatmap. */
export function dailyActivity(records: TrainingRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    const sets = record.movements.reduce((sum, m) => sum + m.sets.length, 0);
    map.set(record.date, (map.get(record.date) ?? 0) + sets);
  }
  return map;
}

export interface DayParts {
  part: string;
  sets: number;
}

/**
 * Body parts trained per ISO date (with set counts), sorted most-sets first.
 * Drives the calendar of concentric body-part rings on the Stats page.
 */
export function dailyBodyParts(
  records: TrainingRecord[],
  exercises: ExerciseDef[]
): Map<string, DayParts[]> {
  const nameToPart = nameToPartMap(exercises);
  const byDate = new Map<string, Map<string, number>>();
  for (const record of records) {
    const row = byDate.get(record.date) ?? new Map<string, number>();
    for (const movement of record.movements) {
      if (movement.sets.length === 0) continue;
      const part = nameToPart.get(movement.name) ?? record.topic ?? "Other";
      row.set(part, (row.get(part) ?? 0) + movement.sets.length);
    }
    byDate.set(record.date, row);
  }
  const out = new Map<string, DayParts[]>();
  for (const [date, row] of byDate) {
    const arr = [...row.entries()]
      .map(([part, sets]) => ({ part, sets }))
      .sort((a, b) => b.sets - a.sets || a.part.localeCompare(b.part));
    if (arr.length) out.set(date, arr);
  }
  return out;
}

/** Total sessions and volume per body part over the given records. */
export function bodyPartFrequency(
  records: TrainingRecord[],
  exercises: ExerciseDef[]
): BodyPartFrequency[] {
  const nameToPart = nameToPartMap(exercises);
  const map = new Map<string, BodyPartFrequency>();
  for (const record of records) {
    const partsInSession = new Set<string>();
    for (const movement of record.movements) {
      const part = nameToPart.get(movement.name) ?? record.topic ?? "Other";
      partsInSession.add(part);
      const entry = map.get(part) ?? { bodyPart: part, sessions: 0, volume: 0 };
      entry.volume += movementVolume(movement);
      map.set(part, entry);
    }
    for (const part of partsInSession) {
      const entry = map.get(part)!;
      entry.sessions += 1;
    }
  }
  return [...map.values()].map((e) => ({ ...e, volume: Math.round(e.volume) }));
}
