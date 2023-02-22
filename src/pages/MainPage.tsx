import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import React from 'react';
import '../App.css';
import { BottomNavBar, RecordList } from '../utils/Components';
import { Record } from '../utils/Interfaces';

export function MainPage(props: { rows: Record[] }) {
  const allTypes = new Set(props.rows.map((row) => row.topic));
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  return (<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
    <Paper>
      <Stack direction="row" spacing={1} >
        <div>{
          Array.from(allTypes.values()).map((type) => {
            return <Chip label={type} onClick={() => {
              if (selectedTypes.includes(type)) {
                setSelectedTypes(selectedTypes.filter((selectedType) => selectedType !== type))
              } else {
                setSelectedTypes([...selectedTypes, type])
              }
            }} color={selectedTypes.includes(type) ? "success" : "info"} />
          })}
        </div>
      </Stack>
      {
        selectedTypes.length === 0 ? "Select a type" :
          <RecordList records={props.rows} selectedTypes={selectedTypes} />
      }
    </Paper>
    <BottomNavBar selection={0} />
  </ThemeProvider>)
}
