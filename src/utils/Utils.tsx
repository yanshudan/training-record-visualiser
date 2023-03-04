import { movementToPart, oneday, today } from "./Constants";
import { Movement } from "./RecordSerializer";

export function DetectTopic(movements: Movement[]): string {
    return movementToPart.get(movements[0].name) || "Other" as string;
}

export function MinusDays(n: number) {
    const ret = today.getTime() - n * oneday;
    return new Date(ret);
}
export function DateDiffInDays(date1: Date, date2: Date) {
    const fullDate1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const fullDate2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round(Math.abs(fullDate1.getTime() - fullDate2.getTime()) / oneday);
}