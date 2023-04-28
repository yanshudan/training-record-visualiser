import { Box, Slider, Stack, TextField } from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import React from 'react';
import '../App.css';
import { oneday } from '../utils/Constants';
import { BodyStatus, PlanMeta } from '../utils/RecordSerializer';

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
                        if (newValue) {
                            props.setPlanMeta({ ...props.planMeta, start: newValue.toDate() })
                        }
                    }}
                    defaultValue={dayjs(props.planMeta.start)}
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

