export { }
export class Record {
    date: Date = new Date();
    topic: string = "General";
    movements: Movement[] = [];
}
export class Movement {
    name: string = "";
    weight: number = 0;
    unit: UnitEnum = UnitEnum.Kg;
    reps: number[] = [];
}
export enum UnitEnum {
    Kg = 1,
    Lb = 2
}
export class RecordSerializer {
    static deserialize(records: string): Record[] {
        return records.split("\n\n").map(record => this.parseRecord(record));
    }
    static parseRecord(record: string): Record {
        let lines = record.split("\n");
        let date = new Date(lines[0].split("//")[0]);
        let movements = lines.slice(1).map(line => this.parseMovement(line)).filter(m => m !== undefined) as Movement[];
        return { date, movements, topic: "General" };
    }
    static parseMovement(movement: string): Movement | undefined {
        movement = movement.split("//")[0]
        let [meta, ...reps] = movement.split(" ");
        let unit = meta.slice(-2) === "kg" ? UnitEnum.Kg : UnitEnum.Lb;
        let regex = /[0-9./]/;

        const res = meta.slice(0, -2)
        const m = res.match(regex);
        if (m === null) {
            console.log(`Invalid movement:${movement} match:${m}`);
            return undefined;
        }
        // let [name, weight, ] = meta.split(":");
        return { name: res.slice(0, m.index), weight: Number(res.slice(m.index)), unit: Number(unit), reps: reps.map(rep => Number(rep)) };
    }
}