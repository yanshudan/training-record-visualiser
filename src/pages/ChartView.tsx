import { Slider } from '@mui/material';
import Paper from '@mui/material/Paper';
import React from 'react';
import { Bar, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import '../App.css';
import { oneday, today } from '../utils/Constants';
import { Record } from '../utils/RecordSerializer';


export function MyComposedChart(props: { filteredRows: Record[] }) {
  const [weeks, setWeeks] = React.useState(12);

  const rangedRows = props.filteredRows
    .filter(row => row.movements.length > 0 && row.date > new Date(today.getTime() - oneday * weeks * 7))
    .reverse()
    .map(row => {
      return {
        date: row.date,
        tillNow: Math.round((today.getTime() - row.date.getTime()) / oneday),
        weight: row.movements[0].sets[0].weight,
        amount: row.movements[0].sets.map(s => s.weight * s.reps).reduce((a, b) => a + b, 0) / 50
      }
    });
  return <Paper>
    <ResponsiveContainer width="95%" height={350} >
      <ComposedChart data={rangedRows}>
        <Tooltip contentStyle={{ background: "#1e1e1e" }} />
        <XAxis dataKey="tillNow" scale="linear" type="number" axisLine={false} tickLine={false} reversed />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke="#afff9d" dot={false} />
        <Bar type="monotone" dataKey="amount" fill="url(#colorPv)" />
        <defs>

          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#65b4f1" stopOpacity={1} />
            <stop offset="95%" stopColor="#9dffc0" stopOpacity={1} />
          </linearGradient>
        </defs>
      </ComposedChart>
    </ResponsiveContainer>
    <Slider
      aria-label="Custom marks"
      defaultValue={12}
      min={12}
      max={52}
      sx={{ width: "80%", left: "10%" }}
      // getAriaValueText={valuetext}
      step={4}
      valueLabelDisplay="on"
      marks={[
        { value: 12, label: "12 weeks" },
        { value: 20, label: "20 weeks" },
        { value: 36, label: "36 weeks" },
        { value: 52, label: "52 weeks" },
      ]}
      onChange={(_, val) => { setWeeks(val as number) }}
    />

  </Paper>
}
