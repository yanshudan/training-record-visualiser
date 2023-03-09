import { ActivityRings } from '@jonasdoesthings/react-activity-rings';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import TimerIcon from '@mui/icons-material/Timer';
import { Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, Slider, Stack, TextField } from '@mui/material';
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
import { movementToPart, oneday, today } from '../utils/Constants';
import { movementDefinitions } from './Constants';
import { BodyStatus, Movement, PlanMeta, Record, RecordSerializer, TrainSet, UnitEnum } from './RecordSerializer';
import { DateDiffInDays, MinusDays } from './Utils';

export function Movements(props: {
  movements: Movement[];
}) {
  return <div>
    {
      props.movements.map((movement) => {
        return (<Typography sx={{ mb: 1.5 }}>
          {RecordSerializer.serializeMovement(movement)}
        </Typography>)
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
          onDuplicateEmpty={() => {
            props.setRecords([{
              date: today,
              topic: record.topic,
              comment:"",
              movements: record.movements.map((movement: Movement) => {
                return {
                  ...movement,
                  sets: [{ ...(movement.sets[0]), reps: 0 }],
                  comment:""
                }
              })
            }, ...props.records,])
          }}
          onUpdate={(newRecord: Record, updateMeta: boolean) => {
            props.setRecords(props.records.map((r) => { return r === record ? (updateMeta ? newRecord : { ...newRecord, topic: record.topic, date: record.date }) : r }))
          }} />
      </div>)
    })}
    {showPlaceHolderCard && <Card sx={{ "border-radius": "10px", "margin-bottom": "1px", height: "200px" }} variant="outlined">
      <CardContent sx={{ "padding-bottom": "0px" }}>
        <Typography variant="h5" component="div" display="inline-block" onClick={() => {
          const firstSelectedPart = movementDefinitions.get(movementToPart.get(props.selectedTypes[0]) || "");
          const useDefault = props.selectedTypes.length === 0 || firstSelectedPart === undefined;
          props.setRecords([{
            date: today,
            comment:"Comments",
            topic: useDefault ? "Legs" : props.selectedTypes[0],
            movements: [{
              name: useDefault ? "深蹲" : firstSelectedPart.movements[0],
              comment:"Comments",
              sets: [
                {
                  weight: 20,
                  reps: 10,
                  unit: UnitEnum.kg
                },
                {
                  weight: 20,
                  reps: 10,
                  unit: UnitEnum.kg
                },
                {
                  weight: 30,
                  reps: 10,
                  unit: UnitEnum.lb
                },
                {
                  weight: 30,
                  reps: 8,
                  unit: UnitEnum.lb
                },
              ]
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
  onDuplicateEmpty: () => void,
  onUpdate: (record: Record, updateMeta: boolean) => void
}) {
  const [showEditor, setShowEditor] = React.useState(false);
  const [value, setValue] = React.useState<string>(RecordSerializer.serialize(props.record));
  const [openClearReps, setOpenClearReps] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);

  return <Card sx={{ "border-radius": "10px", "margin-bottom": "1px" }} variant="outlined">
    {showEditor ?
      <TextField
        defaultValue={RecordSerializer.serialize(props.record)}
        multiline
        fullWidth
        onChange={(newVal) => {
          setValue(newVal.target.value)
          try {
            const newRecord = RecordSerializer.parseRecord(newVal.target.value)
            newRecord && props.onUpdate(newRecord, false);
          } catch (e) {
          }
        }} /> :
      <CardContent sx={{ "padding-bottom": "0px" }} onClick={() => { setShowEditor(true) }}>
        <Typography sx={{ position: "fixed", right: "20px", width: "fit-content", color: "#555555" }}>Tap the card to edit</Typography>
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
            setShowEditor(true);
            setValue(RecordSerializer.serialize(props.record));
          }
          else {
            setShowEditor(false);
            const newRecord = RecordSerializer.parseRecord(value);
            newRecord && props.onUpdate(newRecord, true);
          }
        }}>{showEditor ? "Confirm" : "Edit"}</Button>
      <Button size="small" onClick={props.onDuplicateEmpty} disabled={!props.editable || showEditor}>Start Another</Button>
      <Button size="small" onClick={() => {
        setOpenDelete(true);
      }} disabled={!props.editable || showEditor}>Delete</Button>
      <ConfirmDialog
        open={openDelete}
        title="Delete Record"
        content="Are you sure you want to delete this record?"
        onClose={(confirmed: boolean) => {
          setOpenDelete(false)
          if (!confirmed) return;
          props.onDelete()
        }} />
    </CardActions>
  </Card>
}

export function ConfirmDialog(props: { open: boolean, onClose: (confirmed: boolean) => void, title: string, content: string }) {
  return <Dialog
    open={props.open}
    onClose={() => props.onClose(false)}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">
      {props.title}
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {props.content}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => props.onClose(true)}>Confirm</Button>
      <Button onClick={() => props.onClose(false)} autoFocus> Cancel </Button>
    </DialogActions>
  </Dialog>
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
        weight: row.movements[0].sets[0].weight,
        amount: row.movements[0].sets.map(s => s.weight * s.reps).reduce((a, b) => a + b, 0) / 50
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

export function Activities(props: {
  records: Record[],
  current: BodyStatus,
  target: BodyStatus,
  planMeta: PlanMeta,
}) {
  const totalDays = 28;

  return <Grid container columns={{ xs: 7, sm: 8, md: 12 }}>
    {Array.from(Array(totalDays + 7)).map((_, index) => {
      const daydiff = totalDays - (index - today.getDay());
      const row = props.records.find((r) => DateDiffInDays(today, r.date) === daydiff);
      const date = MinusDays(daydiff);

      const planProgress = DateDiffInDays(date, new Date(props.planMeta.start));
      const planBase = 300 * Math.log(props.planMeta.FFMIlimit - props.current.FFMI) / (-props.planMeta.growthRatio);
      const expectedFFMI = props.planMeta.FFMIlimit - Math.exp(-props.planMeta.growthRatio * (planProgress + planBase) / 300);
      const expectedFFM = expectedFFMI * Math.pow(props.planMeta.height / 100, 2);
      const getRings = () => {
        if (daydiff < 0 || daydiff >= totalDays) {
          return [
            { filledPercentage: 0.35, color: "#" },
            { filledPercentage: 0.55, color: "#" },
            { filledPercentage: 0.75, color: "#" },
            { filledPercentage: 0.55, color: "#" },
            { filledPercentage: 0.75, color: "#" },]
        }
        if (row === undefined) {
          return [
            { filledPercentage: 0.35, color: "#555555" },
            { filledPercentage: 0.55, color: "#444444" },
            { filledPercentage: 0.55, color: "#333333" },
            { filledPercentage: 0.75, color: "#222222" },
            { filledPercentage: 0.75, color: "#191919" },]
        }
        // const colorconfig = movementDefinitions[row.topic] || { inColor: "#457457", outColor: "#754754" };
        const cardioSet = row.movements.find((m: Movement) => movementToPart.get(m.name) === "Cardio");
        const bodySet = row.movements.find((m: Movement) => {
          const part = movementToPart.get(m.name)
          return part === "Legs" || part === "Chest" || part === "Back";
        });
        const armSet = row.movements.find((m: Movement) => {
          const part = movementToPart.get(m.name)
          return part === "Bicep" || part === "Tricep";
        });
        return [
          {
            filledPercentage: cardioSet === undefined ? 0.75 :
              cardioSet.sets.map(s => s.weight * s.reps).reduce((a, b) => a + b, 0) / (expectedFFMI * props.planMeta.expectedCalory),
            color: cardioSet === undefined ? "#555555" : "#ffffff"
          },
          {
            filledPercentage: bodySet === undefined ? 0.75 :
              bodySet.sets.map(s => s.reps).reduce((a, b) => a + b, 0) / (expectedFFMI * props.planMeta.amountRatio),
            color: bodySet === undefined ? "#444444" : movementDefinitions.get(movementToPart.get(bodySet.name)!)!.theme.inColor
          },
          {
            filledPercentage: bodySet === undefined ? 0.75 :
              bodySet.sets[0].weight / (expectedFFM * props.planMeta.strengthRatio),
            color: bodySet === undefined ? "#333333" : movementDefinitions.get(movementToPart.get(bodySet.name)!)!.theme.outColor
          },
          {
            filledPercentage: armSet === undefined ? 0.75 :
              armSet.sets.map(s => s.reps).reduce((a, b) => a + b, 0) / (expectedFFMI * props.planMeta.amountRatio),
            color: armSet === undefined ? "#222222" : movementDefinitions.get(movementToPart.get(armSet.name)!)!.theme.inColor
          },
          {
            filledPercentage: armSet === undefined ? 0.75 :
              armSet.sets[0].weight / (expectedFFM * props.planMeta.strengthRatio),
            color: armSet === undefined ? "#191919" : movementDefinitions.get(movementToPart.get(armSet.name)!)!.theme.outColor
          },
        ];
      }
      return <Grid item xs={1} sm={4} md={4} key={index}>
        <ActivityRings rings={getRings()} />
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
    <Box sx={{ padding: "10px" }} />
    <Stack direction="row">
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
          onChange={(newValue) => {
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

export function ActivitySliders(props: { planMeta: PlanMeta, setPlanMeta: (planMeta: PlanMeta) => void }) {
  return <>
    <Slider
      min={0.1}
      max={2}
      step={0.1}
      onChange={(_, val) => {
        props.setPlanMeta({ ...props.planMeta, strengthRatio: +val });
      }}
      marks={[
        { value: 0.2, label: "Weak" },
        { value: 1.0, label: "Average" },
        { value: 1.8, label: "Strong" },
      ]}
      defaultValue={props.planMeta.strengthRatio}
      sx={{ width: "80%", left: "10%" }} />
    <Slider
      min={0.4}
      max={4}
      step={0.1}
      marks={[
        { value: 1, label: "Strength" },
        { value: 2, label: "Balance" },
        { value: 3, label: "Durable" },
      ]}
      onChange={(_, val) => {
        props.setPlanMeta({ ...props.planMeta, amountRatio: +val });
      }}
      defaultValue={props.planMeta.amountRatio}
      sx={{ width: "80%", left: "10%" }} />
    <Slider
      min={0.2}
      max={40}
      step={0.2}
      marks={[
        { value: 1, label: "Low" },
        { value: 20, label: "Mid" },
        { value: 30, label: "High" },
      ]}
      onChange={(_, val) => {
        props.setPlanMeta({ ...props.planMeta, expectedCalory: +val });
      }}
      defaultValue={props.planMeta.expectedCalory}
      sx={{ width: "80%", left: "10%" }} />
  </>
}