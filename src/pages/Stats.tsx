import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PaymentIcon from '@mui/icons-material/Payment';
import { Alert } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import { Area, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import '../App.css';
import { RecordList } from '../utils/Components';
import { movementDefinitions, movementToPart } from '../utils/LoadFile';
import { Record } from '../utils/RecordSerializer';

export const oneday = 1000 * 60 * 60 * 24;
export const today = new Date();
export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set(movementDefinitions.map((definition) => definition.part));
  const allTypes = Array.from(allTypesSet.values());
  const [isRenderGraph, setRenderGraph] = React.useState<boolean>(true);
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(["卧推"]);
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(filterRows(props.rows, selectedType, selectedMovements));

  return (<Paper>
    <Paper>
      <Stack direction="row" spacing={1} >
        <div>{
          allTypes.map((type) => {
            return <Chip label={type} onClick={() => {
              setSelectedType(type);
              setSelectedMovements([]);
              setFilteredRows(filterRows(props.rows, type, selectedMovements));
            }} color={selectedType === type ? "success" : "info"} />
          })}
        </div>
      </Stack>
      <Stack sx={{ marginTop: "10px", marginBottom: "20px" }}>
        <div>{
          movementDefinitions.filter((definition) => definition.part === selectedType)[0].movements.map((name) => {
            return <Chip label={name} onClick={() => {
              let newMovements;
              if (selectedMovements.includes(name)) {
                newMovements = selectedMovements.filter((movement) => movement !== name);
              } else {
                newMovements = [...selectedMovements, name];
              }
              setSelectedMovements(newMovements);
              setFilteredRows(filterRows(props.rows, selectedType, newMovements))
            }} color={selectedMovements.includes(name) ? "success" : "info"} />
          })
        }</div>
      </Stack>
      {isRenderGraph ?
        (filteredRows.length <= 1 ? <Alert severity="warning">Not enough data to render graph, create more than 2 records containing the same movement to see the chart</Alert> :
          <ResponsiveContainer width="95%" height={350}>
            <ComposedChart data={filteredRows
              .filter(row => row.movements.length > 0 && row.date > new Date(today.getTime() - oneday * 90))
              .reverse()
              .map(row => {
                return {
                  date: row.date,
                  tillNow: Math.round((today.getTime() - row.date.getTime()) / oneday),
                  weight: row.movements[0].weight,
                  amount: row.movements[0].weight * row.movements[0].reps.reduce((a, b) => a + b, 0) / 50
                }
              })}>
              <Tooltip />
              <XAxis dataKey="tillNow" scale="linear" type="number" axisLine={false} tickLine={false} reversed />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#2ac2d2" />
              <Area type="monotone" dataKey="amount" stroke="#d2c21a" fill="url(#colorPv)" />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ac2d2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2ac2d2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d2c21a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#d2c21a" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        ) :
        <RecordList records={filteredRows} selectedTypes={allTypes} setRecords={() => { }} editable={false} />}
    </Paper>
    <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
      <ToggleButtonGroup exclusive={true} aria-label="text alignment" >
        <ToggleButton value="left" selected={isRenderGraph} onClick={() => setRenderGraph(!isRenderGraph)}>
          <AutoGraphIcon />
        </ToggleButton>
        <ToggleButton value="center" selected={!isRenderGraph} onClick={() => setRenderGraph(!isRenderGraph)}>
          <PaymentIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  </Paper>)
}

function filterRows(rows: Record[], selectedType: string, selectedMovements: string[]) {
  return rows.map(
    (row) => {
      return {
        date: row.date,
        movements: row.movements.filter((movement) => movementToPart.get(movement.name) === selectedType && (selectedMovements.includes(movement.name))),
        topic: row.topic
      }
    }
  ).filter((row) => row.movements.length > 0);
}