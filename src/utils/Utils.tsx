import { movementToPart, oneday, today } from "./Constants";
import { Movement } from "./RecordSerializer";

export function DetectTopic(movements: Movement[]): string {
    return movementToPart.get(movements[0].name) as string;
}

export function MinusDays(n: number) {
    const ret = today.getTime() - n * oneday;
    return new Date(ret);
}
export function DateDiffInDays(date1: Date, date2: Date) {
    return Math.round(Math.abs(date1.getTime() - date2.getTime()) / oneday);
}