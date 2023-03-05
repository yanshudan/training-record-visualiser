import { ActivityRings } from '@jonasdoesthings/react-activity-rings';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import TimerIcon from '@mui/icons-material/Timer';
import { Divider, Grid, Slider, Stack, TextField } from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React from 'react';
import { Bar, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import '../App.css';
import { oneday, themes, today } from '../utils/Constants';
import { movementDefinitions } from './Constants';
import { BodyStatus, Movement, PlanMeta, Record, RecordSerializer, UnitEnum } from './RecordSerializer';
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
      <TextField
        defaultValue={RecordSerializer.serialize(props.record)}
        multiline
        fullWidth
        onChange={(newVal) => {
          setValue(newVal.target.value)
          try {
            const newRecord = RecordSerializer.deserialize(newVal.target.value)[0]
            props.onUpdate(newRecord);
          } catch (e) {
            alert(`Invalid input ${value}, error:${e}`)
          }
        }} /> :
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
          if (!showEditor) {
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

  const rangedRows = props.filteredRows
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
    <ResponsiveContainer width="95%" height={350} >
      <ComposedChart data={rangedRows}>
        <Tooltip contentStyle={{ background: "#1e1e1e" }} />
        <XAxis dataKey="tillNow" scale="linear" type="number" axisLine={false} tickLine={false} reversed />
        <Legend />
        <Line type="monotone" dataKey="weight" stroke="#afff9d" dot={false} />
        <Bar type="monotone" dataKey="amount" fill="url(#colorPv)" />
        <defs>

          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#65b4f1" stopOpacity={1} />
            <stop offset="95%" stopColor="#9dffc0" stopOpacity={1} />
          </linearGradient>
        </defs>
      </ComposedChart>
    </ResponsiveContainer>
    <Slider
      aria-label="Custom marks"
      defaultValue={12}
      min={12}
      max={52}
      sx={{ width: "80%", left: "10%" }}
      // getAriaValueText={valuetext}
      step={4}
      valueLabelDisplay="on"
      marks={[
        { value: 12, label: "12 weeks" },
        { value: 20, label: "20 weeks" },
        { value: 36, label: "36 weeks" },
        { value: 52, label: "52 weeks" },
      ]}
      onChange={(_, val) => { setWeeks(val as number) }}
    />

  </Paper>
}

export function Activities(props: { records: Record[] }) {
  const totalDays = 28;
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
      const colorconfig = row ? (themes[row.topic] || { inColor: "#888800", outColor: "#008888" }) : { inColor: "#555555", outColor: "#111111" };
      return <Grid item xs={1} sm={4} md={4} key={index}>
        <ActivityRings rings={[
          { filledPercentage: row ? row.movements[0].reps.reduce((a, b) => a + b, 0) / 60 : 0.35, color: colorconfig.inColor },
          { filledPercentage: row ? row.movements[0].weight / 60 : 0.75, color: colorconfig.outColor },
        ]} />
        <Typography sx={{ position: "relative", transform: "translateX(20%)", top: "-30%", color: "#555555" }}>{`${date.getMonth() + 1}/${date.getDate()}`}</Typography>
      </Grid>
    })}
  </Grid>
}

export function Planner(props: {
  current: BodyStatus,
  setCurrent: (newCurrent: BodyStatus) => void,
  target: BodyStatus,
  setTarget: (newTarget: BodyStatus) => void,
  planMeta: PlanMeta,
  setPlanMeta: (newPlan: PlanMeta) => void
}) {
  const [endDate, setEndDate] = React.useState(new Date());
  const [currentLevel, setCurrentLevel] = React.useState(0);
  const [targetLevel, setTargetLevel] = React.useState(0);

  React.useEffect(() => {
    const Month0 = 10 * Math.log(props.planMeta.FFMIlimit - 18) / (-props.planMeta.growthRatio);
    const MonthA = 10 * Math.log(props.planMeta.FFMIlimit - props.current.FFMI) / (-props.planMeta.growthRatio);
    const MonthB = 10 * Math.log(props.planMeta.FFMIlimit - props.target.FFMI) / (-props.planMeta.growthRatio);
    const newTimeRange = (MonthB - MonthA) * 30 + 1;
    setCurrentLevel(MonthA - Month0);
    setTargetLevel(MonthB - Month0);
    // console.log(`this is gonna take ${MonthB - MonthA} months`)
    setEndDate(new Date(new Date(props.planMeta.start).getTime() + oneday * newTimeRange));
  }, [
    props.planMeta.FFMIlimit,
    props.planMeta.growthRatio,
    props.planMeta.start,
    props.current.FFMI,
    props.target.FFMI]);

  React.useEffect(() => {
    let current = props.current;
    const height = props.planMeta.height;
    let newCurrent = JSON.parse(JSON.stringify(props.current));
    newCurrent.FFMI = (current.weight * (1 - current.fat / 100) / Math.pow(height / 100, 2) + ((height > 180) ? 0.06 * (height - 180) : 0));
    props.setCurrent({ ...newCurrent });
  }, [props.current.fat, props.current.weight, props.planMeta.height]);

  React.useEffect(() => {
    let target = props.target;
    const height = props.planMeta.height;
    let newTarget = JSON.parse(JSON.stringify(props.target));
    newTarget.weight = ((target.FFMI - ((height > 180) ? 0.06 * (height - 180) : 0)) * Math.pow(height / 100, 2) / (1 - target.fat / 100));
    props.setTarget({ ...newTarget });
  }, [props.target.FFMI, props.target.fat, props.planMeta.height]);

  return <Paper>
    <Stack direction="row" sx={{ marginTop: "15px" }}>
      <Typography sx={{ margin: "10px" }}>Training Planner</Typography>
      <TextField label="Height(cm)" type="number" defaultValue={props.planMeta.height} onChange={(val) => {
        props.setPlanMeta({ ...props.planMeta, height: +val.target.value });
      }}></TextField>
      <TextField label="FFMI Limit" type="number" defaultValue={props.planMeta.FFMIlimit} onChange={(val) => {
        props.setPlanMeta({ ...props.planMeta, FFMIlimit: +val.target.value });
      }}></TextField>
    </Stack>
    <Stack direction="row">
      <TextField label="Weight(kg)" type="number" defaultValue={props.current.weight} onChange={(val) => {
        props.setCurrent({ ...props.current, weight: +val.target.value })
      }}></TextField>
      <TextField label="Body Fat(%)" type="number" defaultValue={props.current.fat} onChange={(val) => {
        props.setCurrent({ ...props.current, fat: +val.target.value })
      }}></TextField>
      <TextField label="FFMI" type="number" disabled value={props.current.FFMI.toFixed(3)}></TextField>
    </Stack>
    <Stack direction="row" sx={{ marginTop: "15px" }}>
      <TextField label="Target Weight(kg)" type="number" disabled value={props.target.weight.toFixed(1)}></TextField>
      <TextField label="Target Body Fat(%)" type="number" defaultValue={props.target.fat} onChange={(val) => {
        props.setTarget({ ...props.target, fat: +val.target.value })
      }}></TextField>
      <TextField label="Target FFMI" type="number" defaultValue={props.target.FFMI} onChange={(val) => {
        props.setTarget({ ...props.target, FFMI: +val.target.value })
      }}></TextField>
    </Stack>
    <Slider
      min={0.19}
      max={0.35}
      step={0.01}
      defaultValue={props.planMeta.growthRatio}
      sx={{ width: "80%", left: "10%" }}
      onChange={(_, val) => {
        props.setPlanMeta({ ...props.planMeta, growthRatio: +val });
      }}
      marks={[
        { value: 0.22, label: "Slow" },
        { value: 0.27, label: "Medium" },
        { value: 0.32, label: "Fast" },
      ]}
    ></Slider>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" sx={{ marginTop: "15px" }}>
        <DatePicker
          label="Start from"
          // value={value}
          onChange={(newValue) => {
            // const newDate=new Date(JSON.stringify(newValue));
            // console.log(JSON.stringify(newValue));
            console.log(props.planMeta.start);
            props.setPlanMeta({ ...props.planMeta, start: newValue as Date })
          }}
        />
        <TextField
          disabled
          label="End at"
          value={`${String(endDate.getMonth() + 1).padStart(2, '0')} / ${String(endDate.getDate()).padStart(2, '0')} / ${endDate.getFullYear()}`} />
      </Stack>
    </LocalizationProvider>
    <Stack direction="row" sx={{ marginTop: "15px" }}>
      <TextField label="Current Level(months)" type="number" disabled value={currentLevel.toFixed(1)}></TextField>
      <TextField label="Target Level(months)" type="number" disabled value={targetLevel.toFixed(1)}></TextField>
    </Stack>
  </Paper>
}