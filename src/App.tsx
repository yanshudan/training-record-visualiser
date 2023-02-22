import './App.css';
import { RecordList } from './Components';
import { LoadTrainingRecords } from './LoadFile';
import { RecordSerializer } from './RecordSerializer';
import React from 'react'
import { DetectTopic } from './Utils';

function App() {
  const rows = RecordSerializer.deserialize(LoadTrainingRecords())
    .reverse()
    .map((record) => {
      return {
        date:record.date,
        topic: DetectTopic(record.movements) as string,
        movements: record.movements
      }
    })

  return <RecordList records={rows}/>
}


export default App;
