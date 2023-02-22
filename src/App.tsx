import './App.css';
import { RecordList } from './Components';
import { LoadTrainingRecords } from './LoadFile';
import { RecordSerializer } from './RecordSerializer';
import React from 'react'
import { DetectTopic } from './Utils';
import { Record } from './Interfaces';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';


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

  return (<MainTable rows={rows} />)
}
function MainTable(props: { rows: Record[] }) {
  const allTypes = new Set(props.rows.map((row) => row.topic));
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  return (<div>
    {<Stack direction="row" spacing={1} sx={{ background: "rgb(50, 50, 50)" }}>
      <div>{
        Array.from(allTypes.values()).map((type) => {
          return <Chip label={type} onClick={() => {
            if (selectedTypes.includes(type)) {
              setSelectedTypes(selectedTypes.filter((selectedType) => selectedType !== type))
            } else {
              setSelectedTypes([...selectedTypes, type])
            }
          }} color={ selectedTypes.includes(type)?"success":"info"} />
        })}
      </div>
    </Stack>}
    {
      selectedTypes.length === 0 ? "Select a type" :
        <RecordList records={props.rows} selectedTypes={selectedTypes} />
    }
  </div>)
}

export default App;
