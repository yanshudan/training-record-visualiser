import { today } from "./Constants";
import { DetectTopic, isNumeric } from "./Utils";

export class RecordSerializer {
  static serialize(record: Record): string {
    return `${record.date.toISOString().split("T")[0]} ${record.topic} ${record.comment}\n${record.movements.map(
      movement => this.serializeMovement(movement)
    ).join("\n")}`;
  }
  static deserialize(records: string): Record[] {
    return records.split("\n\n").map(record => this.parseRecord(record)).filter(r => r !== undefined) as Record[];
  }
  static parseRecord(record: string): Record | undefined {
    try {
      let lines = record.split("\n").filter(line => line !== "");
      let [dateStr, topic, comment] = lines[0].split(" ");
      const date = this.parseDate(dateStr);

      let movements = lines.slice(1).map(line => this.parseMovement(line)).filter(m => m !== undefined) as Movement[];
      if (movements.length === 0) return undefined;
      return { date, movements, topic: topic || DetectTopic(movements) || "General", comment: comment || "" };
    }
    catch (e) {
      console.log(`Invalid record:${record} ${e}`);
      return undefined;
    }

  }

  static serializeMovement(movement: Movement): string {
    let ret = movement.name;
    let lastSet = undefined;
    for (const trainSet of movement.sets) {
      if (lastSet === undefined || lastSet.unit !== trainSet.unit || lastSet.weight !== trainSet.weight) {
        ret += ` ${trainSet.weight}${UnitEnum[trainSet.unit]}`;
      }
      ret += ` ${trainSet.reps}`;
      lastSet = trainSet;
    }
    return ret + ` ${movement.comment}`;
  }

  static parseDate(dateStr: string): Date {
    let date = new Date(dateStr);
    if (date.getFullYear() === 2001) date.setFullYear(today.getFullYear());
    if (date.getTime() > today.getTime()) date.setFullYear(date.getFullYear() - 1);
    return date;
  }

  static parseMovement(raw: string): Movement | undefined {
    try {
      if (raw === "") return undefined;
      const regex = /([\d\.]+)(kg|lb|km|bpm|min)/g;
      const matches = [...raw.matchAll(regex)];
      if (matches === null || matches.length === 0) {
        return {
          name: raw.trim(),
          sets: [],
          comment: ""
        }
      }
      let sets: TrainSet[] = [];
      let lastMatch: RegExpMatchArray = [""];
      for (const match of matches) {
        if (match.index !== undefined && lastMatch.length > 1 && lastMatch.index !== undefined) {
          const weight = +lastMatch[1];
          const unit = lastMatch[2];
          const reps = raw.slice(lastMatch.index + lastMatch[0].length, match.index).trim().split(" ");
          sets = [...sets, ...reps.map(r => { return { weight, unit: UnitEnum[unit as keyof typeof UnitEnum], reps: +r } }).filter(r => !Number.isNaN(r.reps))];
        }
        lastMatch = match;
      }
      let comment = "";
      if (lastMatch.length > 1 && lastMatch.index !== undefined) {
        const reps = raw.slice(lastMatch.index + lastMatch[0].length).trim().split(" ");
        if (!isNumeric(reps[reps.length - 1])) {
          comment = reps.pop() || "";
        }
        sets = [...sets, ...reps.map(r => { return { weight: +lastMatch[1], unit: UnitEnum[lastMatch[2] as keyof typeof UnitEnum], reps: +r } }).filter(r => !Number.isNaN(r.reps))];
      }
      return {
        name: raw.slice(0, matches[0].index).trim(),
        sets: sets,
        comment: comment
      };
    }
    catch (e) {
      console.log(`Invalid movement:${raw} ${e}`);
      return undefined;
    }
    // let [name, weight, ] = meta.split(":");
  }
}
export class Record {
  date: Date = today;
  topic: string = "Other";
  movements: Movement[] = [];
  comment: string = "";
}
export class Movement {
  name: string = "";
  sets: TrainSet[] = [];
  comment: string = "";
}
export class TrainSet {
  weight: number = 0;
  unit: UnitEnum = UnitEnum.kg;
  reps: number = 0;
}
export enum UnitEnum {
  kg = 1,
  lb = 2,
  km = 3,
  bpm = 4,
  min = 5,
}

export class PlanMeta {
  height: number = 170;
  start: Date = today;
  FFMIlimit: number = 25;
  growthRatio: number = 0.3;
  strengthRatio: number = 1;
  amountRatio: number = 1;
  expectedCalory: number = 10;
}
export class BodyStatus {
  weight: number = 0;
  fat: number = 1;
  FFMI: number = 1
}
export class Plan {
  planMeta: PlanMeta = new PlanMeta();
  current: BodyStatus = new BodyStatus();
  target: BodyStatus = new BodyStatus();
}