import { today } from "./Constants";
import { DetectTopic } from "./Utils";

export class RecordSerializer {
  static serialize(record: Record): string {
    return `${record.date.toISOString().split("T")[0]} ${record.topic}\n${record.movements.map(
      movement => `${movement.name} ${movement.weight}${UnitEnum[movement.unit]} ${movement.reps.join(" ")}`
    ).join("\n")}`;
  }
  static deserialize(records: string): Record[] {
    return records.split("\n\n").map(record => this.parseRecord(record)).filter(r => r !== undefined) as Record[];
  }
  static parseRecord(record: string): Record | undefined {
    try {
      let lines = record.split("\n");
      let [dateStr, topic] = lines[0].split("//")[0].split(" ");
      const date = this.parseDate(dateStr);

      let movements = lines.slice(1).map(line => this.parseMovement(line)).filter(m => m !== undefined) as Movement[];
      return { date, movements, topic: topic || DetectTopic(movements) || "General" };
    }
    catch (e) {
      console.log(`Invalid record:${record} ${e}`);
      return undefined;
    }

  }

  static parseDate(dateStr: string): Date {
    let date = new Date(dateStr);
    if (date.getFullYear() === 2001) date.setFullYear(today.getFullYear());
    if (date.getTime() > today.getTime()) date.setFullYear(date.getFullYear() - 1);
    return date;
  }

  static parseMovement(raw: string): Movement | undefined {
    try {
      raw = raw.split("//")[0];
      const regex = /[\d\.]+(kg|lb)/;
      const match = raw.match(regex);
      if (match === null || match.length === 0) {
        throw new Error("No weight found");
      }
      let weightWithUnit = match[0];
      let unit = weightWithUnit.slice(-2) === "kg" ? UnitEnum.kg : UnitEnum.lb;
      let reps = raw.slice(match.index! + weightWithUnit.length).trim().split(" ");
      return {
        name: raw.slice(0, match.index).trim(), weight: Number(weightWithUnit.slice(0, -2)), unit, reps: reps.filter(r => r !== "").map(rep => {
          if (rep.indexOf("/") !== -1) {
            throw new Error("Fractional reps not supported");
          }
          return Number(rep)
        })
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
}
export class Movement {
  name: string = "";
  weight: number = 0;
  unit: UnitEnum = UnitEnum.kg;
  reps: number[] = [];
}
export enum UnitEnum {
  kg = 1,
  lb = 2
}

export class PlanMeta {
  height: number = 170;
  start: Date = today;
  FFMIlimit: number = 25;
  growthRatio: number = 1;
  strengthRatio: number = 1;
  amountRatio: number = 1;
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