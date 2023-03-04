import { ActivityRings } from '@jonasdoesthings/react-activity-rings';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import TimerIcon from '@mui/icons-material/Timer';
import { Divider, Grid, Slider, TextField } from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React from 'react';
import { Area, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import '../App.css';
import { oneday, themes, today } from '../utils/Constants';
import { movementDefinitions } from './Constants';
import { Movement, Record, RecordSerializer, UnitEnum } from './RecordSerializer';
import { DateDiffInDays, MinusDays } from './Utils';

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
  const showPlaceHolderCard = props.editable || props.records.length === 0;
  return (<div>
    {props.records.filter(
      (record) => props.selectedTypes.includes(record.topic) && record.movements.length > 0
    ).map((record) => {
      return (<div>
        <EditableCard
          record={record}
          editable={props.editable}
          onDelete={() => { props.setRecords(props.records.filter((r) => r !== record)) }}
          onDuplicate={() => { props.setRecords([{ date: today, topic: record.topic, movements: record.movements }, ...props.records,]) }}
          onUpdate={(newRecord: Record) => {
            props.setRecords(props.records.map((r) => { return r === record ? newRecord : r }))
          }} />
      </div>)
    })}
    {showPlaceHolderCard && <Card sx={{ "border-radius": "10px", "margin-bottom": "1px", height: "200px" }} variant="outlined">
      <CardContent sx={{ "padding-bottom": "0px" }}>
        <Typography variant="h5" component="div" display="inline-block" onClick={() => {
          const defaultType = movementDefinitions.find(val => val.part === props.selectedTypes[0]);
          const useDefault = props.selectedTypes.length === 0 || defaultType === undefined;
          props.setRecords([{
            date: today,
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
          {props.editable ? "Create a new record from template" : "No records found"}
        </Typography>
      </CardContent>
    </Card>}
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

export function MyComposedChart(props: { filteredRows: Record[] }) {
  const [weeks, setWeeks] = React.useState(12);

  const rangedRows=props.filteredRows
    .filter(row => row.movements.length > 0 && row.date > new Date(today.getTime() - oneday * weeks * 7))
    .reverse()
    .map(row => {
      return {
        date: row.date,
        tillNow: Math.round((today.getTime() - row.date.getTime()) / oneday),
        weight: row.movements[0].weight,
        amount: row.movements[0].weight * row.movements[0].reps.reduce((a, b) => a + b, 0) / 50
      }
    });
  return <Paper>
    <ResponsiveContainer width="95%" height={350}>
      <ComposedChart data={rangedRows}>
        <Tooltip />
        <XAxis dataKey="tillNow" scale="linear" type="number" axisLine={false} tickLine={false} reversed />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke="#2ac2d2" />
        <Area type="monotone" dataKey="amount" stroke="#d2c21a" fill="url(#colorPv)" />
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2ac2d2" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#2ac2d2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d2c21a" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#d2c21a" stopOpacity={0} />
          </linearGradient>
        </defs>
      </ComposedChart>
    </ResponsiveContainer>
    <Slider
      aria-label="Custom marks"
      defaultValue={12}
      // getAriaValueText={valuetext}
      step={8}
      valueLabelDisplay="auto"
      marks={[
        { value: 12, label: "12 weeks" },
        { value: 20, label: "20 weeks" },
        { value: 36, label: "36 weeks" },
        { value: 52, label: "52 weeks" },
      ]}
      onChange={(_,val) => { setWeeks(val as number) }}
    />

  </Paper>
}

export function Activities(props: { records: Record[] }) {
  const totalDays = 35;
  return <Grid container columns={{ xs: 7, sm: 8, md: 12 }}>
    {Array.from(Array(totalDays + 7)).map((_, index) => {
      const daydiff = totalDays - (index - today.getDay());
      const row = props.records.find((r) => DateDiffInDays(today, r.date) === daydiff);
      const date = MinusDays(daydiff);
      if (daydiff < 0 || daydiff >= totalDays) {

        return today.getDay() !== 6 && <Grid item xs={1} sm={4} md={4} key={index}>
          <ActivityRings rings={[
            { filledPercentage: 0.35, color: "#" },
            { filledPercentage: 0.75, color: "#" },
          ]} />
          <Typography sx={{ position: "relative", transform: "translateX(20%)", top: "-30%", color: "#555555" }}>{`${date.getMonth() + 1}/${date.getDate()}`}</Typography>
        </Grid>
      }
      return <Grid item xs={1} sm={4} md={4} key={index}>
        <ActivityRings rings={[
          { filledPercentage: row ? row.movements[0].reps.reduce((a, b) => a + b, 0) / 60 : 0.35, color: row ? themes[row.topic].inColor : "#555555" },
          { filledPercentage: row ? row.movements[0].weight / 60 : 0.75, color: row ? themes[row.topic].outColor : "#111111" },
        ]} />
        <Typography sx={{ position: "relative", transform: "translateX(20%)", top: "-30%", color: "#555555" }}>{`${date.getMonth() + 1}/${date.getDate()}`}</Typography>
      </Grid>
    })}
  </Grid>
}