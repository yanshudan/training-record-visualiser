import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import React from 'react';
import './App.css';
import { TimerPage } from './pages/Timer';
import { MainPage } from './pages/MainPage';
import { StatsPage } from './pages/Stats';
import { BottomNavBar } from './utils/Components';
import { Record, RecordSerializer } from './utils/RecordSerializer';
import { ClockProps, sampleRecordsRaw } from './utils/Constants';
import { ManualPage } from './pages/ManualPage';

function App() {
  const [rows, setRows] = React.useState<Record[]>(RecordSerializer.deserialize(localStorage.getItem("trainingRecords") || sampleRecordsRaw).sort((a, b) => b.date.getTime() - a.date.getTime()));
  const [section, setSection] = React.useState(0);
  const [clockProps, setClockProps] = React.useState<ClockProps>({ data: { start: 0, mid: 0, end: 0 }});
  const [timer, setTimer] = React.useState<NodeJS.Timer | undefined>(undefined);
  const [allTypes, setAllTypes] = React.useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);

  const setRowsAndStorage = (newRows: Record[]) => {
    setRows(newRows)
    localStorage.setItem("trainingRecords", newRows.map(row => RecordSerializer.serialize(row)).join("\n\n"))
  }
  return <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
    {
      section === 0 ? <MainPage
        rows={rows}
        setRows={setRowsAndStorage}
        allTypes={allTypes}
        setAllTypes={setAllTypes}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
      /> :
        section === 1 ?
          <TimerPage rows={rows} clockProps={clockProps} setClockProps={setClockProps} timer={timer} setTimer={setTimer} /> :
          section === 2 ?
            <StatsPage rows={rows} /> :
            <ManualPage />
    }
    <BottomNavBar selection={section} setSection={setSection} />
  </ThemeProvider>
}


export default App;
