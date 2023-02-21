import React from 'react';
import './App.css';
import { LoadTrainingRecords } from './LoadFile';
import { Movement, Record, RecordSerializer } from './RecordSerializer';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

function App() {

  return RecordTable();
}

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number,
) {
  return { name, calories, fat, carbs, protein };
}

const rows = RecordSerializer.deserialize(LoadTrainingRecords()).reverse();

const movementDefinitions = [
  { part: "Leg", movements: ["squat", "深蹲"] },
  {
    part: "Shoulder", movements: [
      "FacePull",
      "飞鸟",
      "侧平举",
      "推举"
    ]
  },
  {
    part: "Chest", movements: [
      "上斜卧推",
      "卧推",
      "哑铃飞鸟",
      "平板哑铃",
      "平板飞鸟"
    ]
  },
  {
    part: "Back", movements: [
      "下拉",
      "划船",
      "反手杠铃划船",
      "杠铃划船",
      "绳索划船"
    ]
  },
  {
    part: "Bicep", movements: [
      "哑铃弯举",
      "杠铃弯举",
      "弯举"
    ]
  },
  {
    part: "Tricep", movements: [
      "屈伸",
      "碎裂者"
    ]
  },
  {
    part: "Legs", movements: [
      "并脚蹲",
      "深蹲",
      "窄蹲",
      "硬拉"
    ]
  }
]

const movementToPart = new Map<string, string>();

movementDefinitions.map((definition) => {
  return definition.movements.map((movement) => [movement, definition.part])
}).reduce((a, b) => a.concat(b), []).forEach((pair) => {
  movementToPart.set(pair[0], pair[1]);
});

function DetectTopic(movements: Movement[]) {
  const parts = movements.map((movement) => movementToPart.get(movement.name)).filter((part) => part !== "Shoulder");
  const partSet = new Set(parts);
  return partSet.size < 3 ? movementToPart.get(movements[0].name) : "General";
}



interface IMovements {
  movements: Movement[];
}
function MovementComponent(props: Movement) {
  return (<Typography sx={{ mb: 1.5 }} color="text.secondary">
    {props.name + " " + props.weight + "kg " + props.reps.join(" ")}
  </Typography>)
}

function Movements(props: IMovements) {
  return <div>
    {
      props.movements.map((movement) => {
        return (<MovementComponent {...movement} />)
      })}
  </div>
};
interface IRecordList {
  records: Record[];
}
function RecordList(props: IRecordList) {
  return (<div>
    {props.records.map((record) => {
      return (<div>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {record.date.getMonth() + "/" + record.date.getDate()}
        </Typography>
        <Typography variant="h5" component="div">
          {record.topic === "General" ? DetectTopic(record.movements) : record.topic}
        </Typography>
        <Movements movements={record.movements} />
      </div>)
    })}
  </div>)
}
export function RecordTable() {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <RecordList records={rows} />
      </CardContent>
      <CardActions>
        <Button size="small">Duplicate</Button>
        <Button size="small">Delete</Button>
      </CardActions>
    </Card>)
};

export default App;
