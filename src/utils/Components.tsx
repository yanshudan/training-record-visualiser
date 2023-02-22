import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import '../App.css';
import { IMovements, Movement, Record } from './Interfaces';
import React from 'react'
import { Divider } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import '../App.css';

export function MovementComponent(props: Movement) {
  return (<Typography sx={{ mb: 1.5 }}>
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
  setRecords: React.Dispatch<React.SetStateAction<Record[]>>,
  selectedTypes: string[]
}) {
  return (<div>
    {props.records.filter(
      (record) => props.selectedTypes.includes(record.topic) && record.movements.length > 0
    ).map((record) => {
      return (<div>
        <Card sx={{ "border-radius": "10px", "margin-bottom": "1px" }} variant="outlined">
          <CardContent sx={{ "padding-bottom": "0px" }}>
            <Typography variant="h5" component="div" display="inline-block">
              {record.topic}
            </Typography>
            <Typography sx={{ fontSize: 14, "padding-left": "8px" }} color="text.secondary" display="inline-block" gutterBottom>
              {record.date.getMonth() + 1 + "/" + record.date.getDate()}
            </Typography>
            <Movements movements={record.movements} />
          </CardContent>
          <Divider />
          <CardActions>
            <Button size="small">Edit</Button>
            <Button size="small" onClick={() => {
              props.setRecords([{ date: new Date(), topic: record.topic, movements: record.movements },...props.records, ])
            }}>Duplicate</Button>
            <Button size="small" onClick={() => {
              props.setRecords(props.records.filter((r) => r !== record))
            }}>Delete</Button>
          </CardActions>
        </Card>
      </div>)
    })}
  </div>)
}

export function BottomNavBar(props: { selection: number }) {
  return (<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
    <BottomNavigation showLabels value={props.selection} >
      <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
      <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
      <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
    </BottomNavigation>
  </Paper>)
}