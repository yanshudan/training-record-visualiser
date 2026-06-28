// Feature 4 — "Visualise the training record".
// All charts are derived from the user's records + their own exercise/body-part
// definitions: body-part frequency, volume-over-time per body part, and a
// per-exercise progression chart.

import { useMemo, useState } from "react";
import { Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppData } from "../state/AppDataContext";
import { bodyPartFrequency, dailyBodyParts, exerciseProgression, volumeByBodyPart } from "../domain/stats";
import { TrainingHeatmap } from "../components/TrainingHeatmap";

// TODO: optimise the charts — shared theming/axes, memoised series, responsive
// sizing, and lighter recharts usage (see TODO.md "Optimise the charts").

export function StatsPage() {
  const { records, exercises, colorForBodyPart } = useAppData();

  const dayParts = useMemo(() => dailyBodyParts(records, exercises), [records, exercises]);
  const frequency = useMemo(() => bodyPartFrequency(records, exercises), [records, exercises]);
  const { points: volumePoints, parts } = useMemo(
    () => volumeByBodyPart(records, exercises),
    [records, exercises]
  );

  const exerciseNames = useMemo(() => {
    const fromRecords = new Set<string>();
    records.forEach((r) => r.movements.forEach((m) => m.sets.length > 0 && fromRecords.add(m.name)));
    return [...fromRecords].sort();
  }, [records]);

  const [selected, setSelected] = useState<string>("");
  const activeExercise = selected || exerciseNames[0] || "";
  const progression = useMemo(
    () => exerciseProgression(records, activeExercise),
    [records, activeExercise]
  );

  if (records.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5">Stats</Typography>
        <Typography color="text.secondary">No training data yet — log a session on the Today page.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Stats</Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Training frequency
          </Typography>
          <TrainingHeatmap days={dayParts} colorForBodyPart={colorForBodyPart} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Sessions & volume by body part
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={frequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="bodyPart" stroke="#aaa" />
              <YAxis yAxisId="left" stroke="#aaa" />
              <YAxis yAxisId="right" orientation="right" stroke="#aaa" />
              <Tooltip contentStyle={{ background: "#16161a", border: "1px solid #333" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" name="Sessions" fill="#ff7a00" />
              <Bar yAxisId="right" dataKey="volume" name="Volume" fill="#ffc400" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Training volume over time
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumePoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{ background: "#16161a", border: "1px solid #333" }} />
              <Legend />
              {parts.map((part) => (
                <Area
                  key={part}
                  type="monotone"
                  dataKey={part}
                  stackId="1"
                  stroke={colorForBodyPart(part)}
                  fill={colorForBodyPart(part) + "66"}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              Exercise progression
            </Typography>
            <TextField
              select
              size="small"
              label="Exercise"
              value={activeExercise}
              onChange={(e) => setSelected(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {exerciseNames.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={progression}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{ background: "#16161a", border: "1px solid #333" }} />
              <Legend />
              <Line type="monotone" dataKey="topWeight" name="Top weight" stroke="#ff7a00" dot={false} />
              <Line type="monotone" dataKey="est1RM" name="Est. 1RM" stroke="#ffc400" dot={false} />
              <Line type="monotone" dataKey="volume" name="Volume" stroke="#ff4d4d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}
