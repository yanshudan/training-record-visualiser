import React from 'react';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import { CalendarPage } from './pages/Calender';
import { MainPage } from './pages/MainPage';
import { StatsPage } from './pages/Stats';
import { Record } from './utils/RecordSerializer';
import { BottomNavBar } from './utils/Components';

function App() {
  const [rows, setRows] = React.useState<Record[]>([])
  const [section, setSection] = React.useState(0)
  return <div>
    {
      section === 0 ? <MainPage rows={rows} setRows={setRows} /> :
        section === 1 ?
          <CalendarPage rows={rows} /> :
          <StatsPage rows={rows} />
    }
    <BottomNavBar selection={section} setSection={setSection} /></div>
}


export default App;
