// Clock face for the daily timetable. Renders a 24-hour dial with a coloured
// arc per entry (midnight at the top, clockwise).

import { TimetableEntry } from "../data/schema";

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 120;
const INNER = 84;
const MID = (RADIUS + INNER) / 2;

function minuteToAngle(minute: number): number {
  // 0 min -> -90deg (top); full day -> +270.
  return (minute / 1440) * 360 - 90;
}

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function wedgePath(startMin: number, endMin: number): string {
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

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

interface Props {
  entries: TimetableEntry[];
  nowMinute: number;
  activeId?: string | null;
}

export function TimetableClock({ entries, nowMinute, activeId }: Props) {
  const [hx, hy] = polar(minuteToAngle(nowMinute), RADIUS + 10);
  const active = entries.find((e) => e.id === activeId) ?? null;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <filter id="tt-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fff" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={MID}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={RADIUS - INNER}
      />

      {/* Hour ticks */}
      {Array.from({ length: 24 }, (_, h) => {
        const major = h % 6 === 0;
        const a = minuteToAngle(h * 60);
        const [x0, y0] = polar(a, RADIUS + 2);
        const [x1, y1] = polar(a, RADIUS + (major ? 12 : 6));
        return (
          <line
            key={h}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={major ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}
            strokeWidth={major ? 2 : 1}
          />
        );
      })}

      {/* Hour labels */}
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = polar(minuteToAngle(h * 60), RADIUS + 26);
        return (
          <text
            key={h}
            x={x}
            y={y}
            fill="rgba(255,255,255,0.55)"
            fontSize={12}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {h.toString().padStart(2, "0")}
          </text>
        );
      })}

      {/* Entry wedges */}
      {entries.map((e) => {
        const isActive = e.id === activeId;
        return (
          <path
            key={e.id}
            d={wedgePath(e.startMinute, e.endMinute)}
            fill={e.color}
            opacity={isActive ? 1 : 0.7}
            stroke={isActive ? "#fff" : "none"}
            strokeWidth={isActive ? 2 : 0}
            filter={isActive ? "url(#tt-glow)" : undefined}
          >
            <title>{`${e.label} (${minLabel(e.startMinute)}–${minLabel(e.endMinute)})`}</title>
          </path>
        );
      })}

      {/* Now hand */}
      <line
        x1={CENTER}
        y1={CENTER}
        x2={hx}
        y2={hy}
        stroke="#ff7a00"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={CENTER} cy={CENTER} r={4} fill="#ff7a00" />

      {/* Centre read-out */}
      <text
        x={CENTER}
        y={CENTER - 8}
        fill="rgba(255,255,255,0.95)"
        fontSize={22}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {minLabel(nowMinute)}
      </text>
      <text
        x={CENTER}
        y={CENTER + 14}
        fill={active ? active.color : "rgba(255,255,255,0.5)"}
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {active ? truncate(active.label, 16) : "Free"}
      </text>
    </svg>
  );
}

export function minLabel(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
