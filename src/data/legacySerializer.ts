// Parser for the legacy plain-text format that v0.1 stored in
// localStorage["trainingRecords"]. Kept ONLY so we can migrate old data into
// the v2 JSON schema. New code should never write this format.

import { detectBodyPart } from "./bodyParts";
import { Movement, TrainingRecord, TrainSet, Unit } from "./schema";

const UNIT_TOKENS: Record<string, Unit> = {
  kg: "kg",
  lb: "lb",
  km: "km",
  bpm: "bpm",
  min: "min",
};

function isNumeric(str: string): boolean {
  return !isNaN(parseFloat(str));
}

function parseLegacyDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return now.toISOString().slice(0, 10);
  if (date.getFullYear() === 2001) date.setFullYear(now.getFullYear());
  if (date.getTime() > now.getTime()) date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function parseMovement(raw: string): Movement | undefined {
  try {
    if (raw === "") return undefined;
    const regex = /([\d.]+)(kg|lb|km|bpm|min)/g;
    const matches = [...raw.matchAll(regex)];
    if (matches.length === 0) {
      return { name: raw.trim(), sets: [], comment: "" };
    }
    let sets: TrainSet[] = [];
    let lastMatch: RegExpMatchArray | undefined;
    for (const match of matches) {
      if (lastMatch && lastMatch.index !== undefined && match.index !== undefined) {
        const weight = +lastMatch[1];
        const unit = UNIT_TOKENS[lastMatch[2]];
        const reps = raw.slice(lastMatch.index + lastMatch[0].length, match.index).trim().split(" ");
        sets = sets.concat(
          reps.map((r) => ({ weight, unit, reps: +r })).filter((s) => !Number.isNaN(s.reps))
        );
      }
      lastMatch = match;
    }
    let comment = "";
    if (lastMatch && lastMatch.index !== undefined) {
      const reps = raw.slice(lastMatch.index + lastMatch[0].length).trim().split(" ");
      if (reps.length > 0 && !isNumeric(reps[reps.length - 1])) {
        comment = reps.pop() || "";
      }
      const weight = +lastMatch[1];
      const unit = UNIT_TOKENS[lastMatch[2]];
      sets = sets.concat(
        reps.map((r) => ({ weight, unit, reps: +r })).filter((s) => !Number.isNaN(s.reps))
      );
    }
    return { name: raw.slice(0, matches[0].index).trim(), sets, comment };
  } catch {
    return undefined;
  }
}

function parseRecord(record: string): TrainingRecord | undefined {
  try {
    const lines = record.split("\n").filter((line) => line !== "");
    if (lines.length === 0) return undefined;
    const [dateStr, topic, comment] = lines[0].split(" ");
    const date = parseLegacyDate(dateStr);
    const movements = lines.slice(1).map(parseMovement).filter((m): m is Movement => m !== undefined);
    if (movements.length === 0) return undefined;
    return {
      date,
      movements,
      topic: topic || detectBodyPart(movements[0].name) || "General",
      comment: comment || "",
    };
  } catch {
    return undefined;
  }
}

/** Parse the legacy plain-text blob into v2 TrainingRecord[]. */
export function parseLegacyRecords(text: string): TrainingRecord[] {
  return text
    .split("\n\n")
    .map(parseRecord)
    .filter((r): r is TrainingRecord => r !== undefined);
}
