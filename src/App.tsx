import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import React from 'react';
import './App.css';
import { CalendarPage } from './pages/Calender';
import { MainPage } from './pages/MainPage';
import { StatsPage } from './pages/Stats';
import { BottomNavBar } from './utils/Components';
import { Record } from './utils/RecordSerializer';

function App() {
  const [rows, setRows] = React.useState<Record[]>([])
  const [section, setSection] = React.useState(0)
  return <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
    {
      section === 0 ? <MainPage rows={rows} setRows={setRows} /> :
        section === 1 ?
          <CalendarPage rows={rows} /> :
          <StatsPage rows={rows} />
    }
    <BottomNavBar selection={section} setSection={setSection} />
  </ThemeProvider>
}


export default App;
