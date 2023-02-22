import { ThemeProvider } from '@emotion/react';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PaymentIcon from '@mui/icons-material/Payment';
import { createTheme } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import { Area, AreaChart, Legend, Tooltip, XAxis } from 'recharts';
import '../App.css';
import { BottomNavBar, RecordList } from '../utils/Components';
import { Record } from '../utils/RecordSerializer';
import { movementDefinitions, movementToPart } from '../utils/LoadFile';


export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set(movementDefinitions.map((definition) => definition.part));
  const allTypes = Array.from(allTypesSet.values());
  const [isRenderGraph, setRenderGraph] = React.useState<boolean>(true);
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(["卧推"]);
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(filterRows(props.rows, selectedType, selectedMovements));

  return (<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })} >
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
      <Stack sx={{ "margin-top": "10px" }}>
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
        <AreaChart width={400} height={400} data={filteredRows
          .filter(row => row.movements.length > 0 && row.date > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 3))
          .reverse()
          .map(row => {
            return {
              date: row.date,
              weight: row.movements[0].weight,
              amount: row.movements[0].weight * row.movements[0].reps.reduce((a, b) => a + b, 0) / 50
            }
          })}>
          <Tooltip />
          <XAxis dataKey="date" scale="time" />
          <Legend />
          <Area type="monotone" dataKey="weight" stroke="#2ac2d2" fill="url(#colorUv)" />
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
        </AreaChart> :
        <RecordList records={filteredRows} selectedTypes={allTypes} setRecords={() => { }}/>}
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
    <BottomNavBar selection={2} />
  </ThemeProvider>)
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
  )
}