import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import '../App.css';
import React from 'react'
import { Divider } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import '../App.css';
import { TextField } from '@mui/material';
import { Movement, Record, RecordSerializer, UnitEnum } from './RecordSerializer';
import { movementDefinitions } from './LoadFile';
import TimerIcon from '@mui/icons-material/Timer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
export function MovementComponent(props: Movement) {
  return (<Typography sx={{ mb: 1.5 }}>
    {props.name + " " + props.weight + "kg " + props.reps.join(" ")}
  </Typography>)
}

export function Movements(props: {
  movements: Movement[];
}) {
  return <div>
    {
      props.movements.map((movement) => {
        return (<MovementComponent {...movement} />)
      })}
  </div>
};

export function RecordList(props: {
  records: Record[],
  setRecords: (records: Record[]) => void,
  selectedTypes: string[]
  editable: boolean
}) {
  return (<div>
    {props.records.filter(
      (record) => props.selectedTypes.includes(record.topic) && record.movements.length > 0
    ).map((record) => {
      return (<div>
        <EditableCard
          record={record}
          editable={props.editable}
          onDelete={() => { props.setRecords(props.records.filter((r) => r !== record)) }}
          onDuplicate={() => { props.setRecords([{ date: new Date(), topic: record.topic, movements: record.movements }, ...props.records,]) }}
          onUpdate={(newRecord: Record) => {
            props.setRecords(props.records.map((r) => { return r === record ? newRecord : r }))
          }} />
      </div>)
    })}
    <Card sx={{ "border-radius": "10px", "margin-bottom": "1px", height: "200px" }} variant="outlined">
      <CardContent sx={{ "padding-bottom": "0px" }}>
        <Typography variant="h5" component="div" display="inline-block" onClick={() => {
          const defaultType = movementDefinitions.find(val => val.part === props.selectedTypes[0]);
          const useDefault = props.selectedTypes.length === 0 || defaultType === undefined;
          props.setRecords([{
            date: new Date(),
            topic: useDefault ? "Legs" : defaultType.part,
            movements: [{
              name: useDefault ? "深蹲" : defaultType.movements[0],
              weight: 20,
              reps: [10, 10, 10],
              unit: UnitEnum.kg
            }]
          }, ...props.records,])
          if (useDefault) {
            alert("Tap 'Legs' to see your new record")
          }
        }}>
          {"Create a new record"}<br />
          {"from template"}
        </Typography>
      </CardContent>
    </Card>
  </div>)
}
export function EditableCard(props: {
  record: Record,
  editable: boolean,
  onDelete: () => void,
  onDuplicate: () => void,
  onUpdate: (record: Record) => void
}) {
  const [showEditor, setShowEditor] = React.useState(false);
  const [value, setValue] = React.useState("");
  return <Card sx={{ "border-radius": "10px", "margin-bottom": "1px" }} variant="outlined">
    {showEditor ?
      <TextField defaultValue={RecordSerializer.serialize(props.record)} multiline fullWidth onChange={(newVal) => { setValue(newVal.target.value) }} /> :
      <CardContent sx={{ "padding-bottom": "0px" }}>
        <Typography variant="h5" component="div" display="inline-block">
          {props.record.topic}
        </Typography>
        <Typography sx={{ fontSize: 14, "padding-left": "8px" }} color="text.secondary" display="inline-block" gutterBottom>
          {props.record.date.getMonth() + 1 + "/" + props.record.date.getDate()}
        </Typography>
        <Movements movements={props.record.movements} />
      </CardContent>}
    <Divider />
    <CardActions>
      <Button
        size="small"
        disabled={!props.editable}
        onClick={() => {
          if (showEditor) {
            //Confirm changes
            //TODO update new record to global state
            try {
              const newRecord = RecordSerializer.deserialize(value)[0]
              props.onUpdate(newRecord);
            } catch (e) {
              alert(`Invalid input ${value}, error:${e}`)
            }
          } else {
            setValue(RecordSerializer.serialize(props.record))
          }
          setShowEditor(!showEditor)
        }}>{showEditor ? "Confirm" : "Edit"}</Button>
      <Button size="small" onClick={props.onDuplicate} disabled={!props.editable || showEditor}>Duplicate</Button>
      <Button size="small" onClick={props.onDelete} disabled={!props.editable || showEditor}>Delete</Button>
    </CardActions>
  </Card>
}
export function BottomNavBar(props: { selection: number, setSection: React.Dispatch<React.SetStateAction<number>> }) {
  return (<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
    <BottomNavigation showLabels value={props.selection} >
      <BottomNavigationAction onClick={() => props.setSection(0)} label="Records" icon={<FormatListBulletedIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(1)} label="Timer" icon={<TimerIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(2)} label="Statistics" icon={<SsidChartIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(3)} label="Manual" icon={<HelpOutlineIcon />} />
    </BottomNavigation>
  </Paper>)
}