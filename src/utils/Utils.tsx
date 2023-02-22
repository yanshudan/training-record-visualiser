import { movementToPart } from "./LoadFile";
import { Movement } from "./RecordSerializer";

export function DetectTopic(movements: Movement[]) {
    const parts = movements.map((movement) => movementToPart.get(movement.name)).filter((part) => part !== "Shoulder");
    const partSet = new Set(parts);
    return partSet.size < 3 ? movementToPart.get(movements[0].name) : "General";
}