import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import React from 'react';
import '../App.css';
import { BottomNavBar } from '../utils/Components';
import { Record } from '../utils/Interfaces';

export function StatsPage(props: { rows: Record[] }) {
  const allTypes = new Set(props.rows.map((row) => row.topic));
  const [selectedType, setSelectedType] = React.useState<string>("Chest");

  return (<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })} >
    <Paper>
      <Stack direction="row" spacing={1} >
        <div>{
          Array.from(allTypes.values()).map((type) => {
            return <Chip label={type} onClick={() => {
                setSelectedType(type)
            }} color={selectedType===type ? "success" : "info"} />
          })}
        </div>
      </Stack>
    </Paper>
    <BottomNavBar selection={2}/>
  </ThemeProvider>)
}