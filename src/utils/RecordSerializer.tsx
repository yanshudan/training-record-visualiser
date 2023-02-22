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
        return { date, movements, topic: "General" };
    }
    static parseMovement(movement: string): Movement | undefined {
        movement = movement.split("//")[0]
        let [meta, ...reps] = movement.split(" ");
        let unit = meta.slice(-2) === "kg" ? UnitEnum.kg : UnitEnum.lb;
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