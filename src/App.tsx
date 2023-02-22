import './App.css';
import { RecordList } from './Components';
import { LoadTrainingRecords } from './LoadFile';
import { RecordSerializer } from './RecordSerializer';
import React from 'react'
import { DetectTopic } from './Utils';
import { Record } from './Interfaces';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Paper from '@mui/material/Paper';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route }
  from "react-router-dom";

function App() {
  const rows = RecordSerializer.deserialize(LoadTrainingRecords())
    .reverse()
    .map((record) => {
      return {
        date: record.date,
        topic: DetectTopic(record.movements) as string,
        movements: record.movements
      }
    })

  return (
    <Router>
      <Routes>
        <Route path="/stat" element={<StatsPage rows={[rows[0]]} />} />
        <Route path="/calendar" element={<CalendarPage rows={[rows[0]]} />} />
        <Route path="/" element={<MainTable rows={rows} />} />
      </Routes>
    </Router>
  )
}
function StatsPage(props: { rows: Record[] }) {
  const [value, setValue] = React.useState(2);

  return (<div>STATS<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>

    <BottomNavigation
      showLabels
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
    >
      <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
      <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
      <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
    </BottomNavigation>
  </Paper></div>)
}
function CalendarPage(props: { rows: Record[] }) {
  const [value, setValue] = React.useState(1);
  return (<div>This page is under construction<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>

    <BottomNavigation
      showLabels
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
    >
      <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
      <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
      <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
    </BottomNavigation>
  </Paper></div>)
}
function MainTable(props: { rows: Record[] }) {
  const allTypes = new Set(props.rows.map((row) => row.topic));
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  const [value, setValue] = React.useState(0);
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
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>

        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
        >
          <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
          <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
          <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
        </BottomNavigation>
      </Paper>
    </Paper>
  </ThemeProvider>)
}

export default App;
