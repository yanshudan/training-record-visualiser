import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import './App.css';
import { IMovements, Movement, Record } from './Interfaces';
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

export function RecordList(props: {
  records: Record[],
  selectedTypes: string[]
}) {
  return (<div>
    {props.records.filter(
      (record) => props.selectedTypes.includes(record.topic)
    ).map((record) => {
      return (<div>
        <Card sx={{ maxWidth: 300 }} variant="outlined">
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {record.date.getMonth() + "/" + record.date.getDate()}
            </Typography>
            <Typography variant="h5" component="div">
              {record.topic}
            </Typography>
            <Movements movements={record.movements} />
          </CardContent>
          <CardActions>
            <Button size="small">Edit</Button>
            <Button size="small">Duplicate</Button>
            <Button size="small">Delete</Button>
          </CardActions>
        </Card>
      </div>)
    })}
  </div>)
}

