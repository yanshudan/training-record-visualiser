import './App.css';
import { RecordTable } from './Components';
import { LoadTrainingRecords } from './LoadFile';
import { RecordSerializer } from './RecordSerializer';

function App() {
  const rows = RecordSerializer.deserialize(LoadTrainingRecords()).reverse();

  return RecordTable(rows);
}


export default App;
