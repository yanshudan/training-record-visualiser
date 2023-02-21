import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import './App.css';
import { IMovements, IRecordList, Movement, Record } from './Interfaces';
import { DetectTopic } from './Utils';
import React from 'react'


export function MovementComponent(props: Movement) {
  return (<Typography sx={{ mb: 1.5 }} color="text.secondary">
    {props.name + " " + props.weight + "kg " + props.reps.join(" ")}
  </Typography>)
}

export function Movements(props: IMovements) {
  return <div>
    {
      props.movements.map((movement) => {
        return (<MovementComponent {...movement} />)
      })}
  </div>
};

export function RecordList(props: IRecordList) {
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


export function RecordTable(rows: Record[]) {
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