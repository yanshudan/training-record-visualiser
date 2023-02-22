import { movementToPart } from "./LoadFile";
import { Movement } from "./RecordSerializer";

export function DetectTopic(movements: Movement[]): string {
    const parts = movements.map((movement) => movementToPart.get(movement.name)).filter((part) => part !== "Shoulder");
    const partSet = new Set(parts);
    if (partSet.size >2 || movements.length === 0 || !movementToPart.has(movements[0].name)) {
        return "General";
    } else {
        return movementToPart.get(movements[0].name) as string;
    }
}