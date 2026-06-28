// Calendar of training days for the last N weeks. Each day is drawn as a set of
// concentric rings — one ring per body part trained that day, coloured with the
// user's own body-part colours. Read-only visual at the top of Stats.

import { useEffect, useMemo, useRef } from "react";
import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import dayjs from "dayjs";
import type { DayParts } from "../domain/stats";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const CELL = 16; // px, the day glyph box
const RING_W = 2; // ring stroke width
const RING_GAP = 1; // gap between rings
const MAX_RINGS = 3; // rings that fit in a CELL; extras fold into the tooltip

interface Cell {
  date: string;
  parts: DayParts[];
  inFuture: boolean;
}

function ringRadii(count: number): number[] {
  const outer = CELL / 2 - RING_W / 2;
  const radii: number[] = [];
  for (let i = 0; i < count; i++) radii.push(outer - i * (RING_W + RING_GAP));
  return radii;
}

function DayGlyph({
  parts,
  trackColor,
  colorForBodyPart,
}: {
  parts: DayParts[];
  trackColor: string;
  colorForBodyPart: (part: string) => string;
}) {
  const c = CELL / 2;
  const shown = parts.slice(0, MAX_RINGS);
  const radii = ringRadii(shown.length);
  return (
    <svg width={CELL} height={CELL} viewBox={`0 0 ${CELL} ${CELL}`}>
      {shown.length === 0 ? (
        <circle cx={c} cy={c} r={CELL / 2 - 1.5} fill="none" stroke={trackColor} strokeWidth={1} />
      ) : (
        shown.map((p, i) => (
          <circle
            key={p.part}
            cx={c}
            cy={c}
            r={Math.max(radii[i], 0.5)}
            fill="none"
            stroke={colorForBodyPart(p.part)}
            strokeWidth={RING_W}
          />
        ))
      )}
    </svg>
  );
}

export function TrainingHeatmap({
  days,
  colorForBodyPart,
  weeks = 26,
}: {
  days: Map<string, DayParts[]>;
  colorForBodyPart: (part: string) => string;
  weeks?: number;
}) {
  const theme = useTheme();
  const trackColor = theme.palette.divider;
  // The newest weeks sit on the right; scroll there so today is visible by default.
  const scrollRef = useRef<HTMLDivElement>(null);

  const { columns, legend } = useMemo(() => {
    const today = dayjs();
    const end = today.day(6); // Saturday of the current week, so columns align
    const start = end.subtract(weeks * 7 - 1, "day");
    const cols: Cell[][] = [];
    const partsSeen = new Set<string>();
    let cursor = start;
    for (let w = 0; w < weeks; w++) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.format("YYYY-MM-DD");
        const parts = days.get(iso) ?? [];
        parts.forEach((p) => partsSeen.add(p.part));
        col.push({ date: iso, parts, inFuture: cursor.isAfter(today, "day") });
        cursor = cursor.add(1, "day");
      }
      cols.push(col);
    }
    return { columns: cols, legend: [...partsSeen].sort((a, b) => a.localeCompare(b)) };
  }, [days, weeks]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [columns]);

  return (
    <Box>
      <Box ref={scrollRef} sx={{ overflowX: "auto", pb: 1 }}>
        <Stack direction="row" spacing={0.4}>
          {/* Weekday labels */}
          <Stack spacing={0.4} sx={{ mr: 0.5 }}>
            {DAY_LABELS.map((label, i) => (
              <Box key={i} sx={{ height: CELL, display: "flex", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, lineHeight: 1 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
          {columns.map((col, ci) => (
            <Stack key={ci} spacing={0.4}>
              {col.map((cell) => {
                const title = cell.inFuture
                  ? cell.date
                  : cell.parts.length === 0
                  ? `${cell.date} — rest`
                  : `${cell.date} — ${cell.parts.map((p) => `${p.part} ${p.sets}`).join(", ")}`;
                return (
                  <Tooltip key={cell.date} arrow title={title}>
                    <Box
                      sx={{
                        width: CELL,
                        height: CELL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: cell.inFuture ? 0 : 1,
                      }}
                    >
                      <DayGlyph parts={cell.parts} trackColor={trackColor} colorForBodyPart={colorForBodyPart} />
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Body-part legend */}
      {legend.length > 0 && (
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {legend.map((part) => (
            <Stack key={part} direction="row" alignItems="center" spacing={0.5}>
              <svg width={12} height={12} viewBox="0 0 12 12">
                <circle cx={6} cy={6} r={4.5} fill="none" stroke={colorForBodyPart(part)} strokeWidth={2} />
              </svg>
              <Typography variant="caption" color="text.secondary">
                {part}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
