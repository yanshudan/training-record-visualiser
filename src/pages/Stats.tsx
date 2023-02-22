import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import React from 'react';
import '../App.css';
import { BottomNavBar, RecordList } from '../utils/Components';
import { Record } from '../utils/Interfaces';
import { movementDefinitions, movementToPart } from '../utils/LoadFile';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PaymentIcon from '@mui/icons-material/Payment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';


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
        <LineChart width={400} height={400} data={filteredRows
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
          <Line type="monotone" dataKey="weight" stroke="#8884d8" />
          <Line type="monotone" dataKey="amount" stroke="#8cc4d8" />
        </LineChart> :
        <RecordList records={filteredRows} selectedTypes={allTypes} />}
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