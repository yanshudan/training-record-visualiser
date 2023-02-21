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
export interface IMovements {
    movements: Movement[];
}
export interface IRecordList {
    records: Record[];
}