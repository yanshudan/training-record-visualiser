// Clock face for the daily timetable. Renders a 24-hour dial with a coloured
// arc per entry (midnight at the top, clockwise).

import { TimetableEntry } from "../data/schema";

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const INNER = 70;

function minuteToAngle(minute: number): number {
  // 0 min -> -90deg (top); full day -> +270.
  return (minute / 1440) * 360 - 90;
}

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function arcPath(startMin: number, endMin: number): string {
  const a0 = minuteToAngle(startMin);
  const a1 = minuteToAngle(endMin <= startMin ? endMin + 1440 : endMin);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  const [ox0, oy0] = polar(a0, RADIUS);
  const [ox1, oy1] = polar(a1, RADIUS);
  const [ix1, iy1] = polar(a1, INNER);
  const [ix0, iy0] = polar(a0, INNER);
  return [
    `M ${ox0} ${oy0}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${ox1} ${oy1}`,
    `L ${ix1} ${iy1}`,
    `A ${INNER} ${INNER} 0 ${largeArc} 0 ${ix0} ${iy0}`,
    "Z",
  ].join(" ");
}

export function TimetableClock({ entries }: { entries: TimetableEntry[] }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <circle cx={CENTER} cy={CENTER} r={RADIUS + 6} fill="none" stroke="#2a2a30" strokeWidth={1} />
      <circle cx={CENTER} cy={CENTER} r={INNER - 6} fill="none" stroke="#2a2a30" strokeWidth={1} />
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = polar(minuteToAngle(h * 60), RADIUS + 20);
        return (
          <text key={h} x={x} y={y} fill="#888" fontSize={11} textAnchor="middle" dominantBaseline="middle">
            {h.toString().padStart(2, "0")}
          </text>
        );
      })}
      {entries.map((e) => (
        <path key={e.id} d={arcPath(e.startMinute, e.endMinute)} fill={e.color} opacity={0.85}>
          <title>{`${e.label} (${minLabel(e.startMinute)}–${minLabel(e.endMinute)})`}</title>
        </path>
      ))}
    </svg>
  );
}

export function minLabel(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
