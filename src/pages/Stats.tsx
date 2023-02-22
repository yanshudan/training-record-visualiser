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

export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set(movementDefinitions.map((definition) => definition.part));
  const allTypes = Array.from(allTypesSet.values());
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(props.rows.map(
    (row) => {
      return {
        date: row.date,
        movements: row.movements.filter((movement) => movementToPart.get(movement.name) === selectedType),
        topic: row.topic
    }}
  ));

  return (<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })} >
    <Paper>
      <Stack direction="row" spacing={1} >
        <div>{
          allTypes.map((type) => {
            return <Chip label={type} onClick={() => {
              setSelectedType(type);
              setFilteredRows(props.rows.map(
                (row) => {
                  return {
                    date: row.date,
                    movements: row.movements.filter((movement) => movementToPart.get(movement.name) === type),
                    topic: row.topic
                
                  }
                }))
              }} color={selectedType===type ? "success" : "info"} />
          })}
        </div>
      </Stack>
      <RecordList records={filteredRows} selectedTypes={allTypes} />
    </Paper>
    <BottomNavBar selection={2}/>
  </ThemeProvider>)
}