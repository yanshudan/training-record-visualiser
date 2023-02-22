import { DetectTopic } from "./Utils";

export class RecordSerializer {
    static serialize(record: Record): string {
        return `${record.date.toISOString().split("T")[0]}\n${record.movements.map(
            movement => `${movement.name} ${movement.weight}${UnitEnum[movement.unit]} ${movement.reps.join(" ")}`
        ).join("\n")}`;
    }
    static deserialize(records: string): Record[] {
        return records.split("\n\n").map(record => this.parseRecord(record));
    }
    static parseRecord(record: string): Record {
        let lines = record.split("\n");
        let date = new Date(lines[0].split("//")[0]);
        let movements = lines.slice(1).map(line => this.parseMovement(line)).filter(m => m !== undefined) as Movement[];
        return { date, movements, topic: DetectTopic(movements) };
    }
    static parseMovement(raw: string): Movement | undefined {
        try {
            const movement = (raw.indexOf("//") == -1) ? raw.split(" ") : raw.split("//")[0].split(" ");
            if (movement.length < 3) { 
                throw new Error("Empty movement");
            }
            let [name, weightWithUnit, ...reps] = movement;
            let unit = weightWithUnit.slice(-2) === "kg" ? UnitEnum.kg : UnitEnum.lb;
            return {
                name, weight: Number(weightWithUnit.slice(0, -2)), unit, reps: reps.filter(r=>r!=="").map(rep => {
                    if (rep.indexOf("/") !== -1) {
                        throw new Error("Fractional reps not supported");
                    }
                    return Number(rep)
                })
            };
        }
        catch (e) {
            console.log(`Invalid movement:${raw} Error:${e}`);
            return undefined;
        }
        // let [name, weight, ] = meta.split(":");
    }
}
export class Record {
    date: Date = new Date();
    topic: string = "General";
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