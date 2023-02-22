import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './App.css';
import { LoadTrainingRecords } from './utils/LoadFile';
import { RecordSerializer } from './RecordSerializer';
import { DetectTopic } from './utils/Utils';
import { MainPage } from './pages/MainPage';
import { CalendarPage } from './pages/Calender';
import { StatsPage } from './pages/Stats';
import React from 'react'
import { Record } from "./utils/Interfaces";

function App() {
  const [rows,setRows] =React.useState<Record[]>( RecordSerializer.deserialize(LoadTrainingRecords())
    .reverse()
    .map((record) => {
      return {
        date: record.date,
        topic: DetectTopic(record.movements) as string,
        movements: record.movements
      }
    }))

  return (
    <Router>
      <Routes>
        <Route path="/stat" element={<StatsPage rows={rows} />} />
        <Route path="/calendar" element={<CalendarPage rows={rows} />} />
        <Route path="/" element={<MainPage rows={rows} setRows={setRows} />} />
      </Routes>
    </Router>
  )
}


export default App;
