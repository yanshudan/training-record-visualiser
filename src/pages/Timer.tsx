import { Button, Paper, TextField } from '@mui/material';
import React from 'react';
import { setInterval } from 'timers';
import '../App.css';
import { Record } from '../utils/RecordSerializer';

export function TimerPage(props: { rows: Record[] }) {
  const [stepA, setStepA] = React.useState<number>(0);
  const [stepB, setStepB] = React.useState<number>(0);
  const [A, setA] = React.useState<number>(0);
  const [B, setB] = React.useState<number>(0);
  const [trigger, setTrigger] = React.useState<boolean>(false);

  return <Paper>
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
      <Clock stepA={stepA} stepB={stepB} trigger={trigger} />
    </Paper >
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
      <TextField label="Step A" type="number" onChange={(event) => setA(parseInt(event.target.value))} />
      <TextField label="Step B" type="number" onChange={(event) => setB(parseInt(event.target.value))} />
    </Paper>
    <Button sx={{ transform: "translateX(-50%)", left: "50%", transformOrigin: "center" }} variant="contained" onClick={() => {
      setStepA(A);
      setStepB(B);
      setTrigger(!trigger)
    }}>start</Button>
  </Paper>
}

export function Clock(props: { stepA: number, stepB: number, trigger: boolean }) {
  const [timerId, setTimerId] = React.useState<NodeJS.Timer>();
  React.useEffect(() => {
    const now = Date.now();
    if (timerId) {
      clearInterval(JSON.parse(JSON.stringify(timerId))._id);
    }
    const timer = setClock(now, now + 1000 * props.stepA, now + 1000 * (props.stepA + props.stepB));
    setTimerId(timer);
  }, [props.stepA, props.stepB, props.trigger]);

  const setClock = (start: number, mid: number, end: number) => {
    if (end <= start) return;
    const element = document.querySelector('[data-hand]') as HTMLElement;
    const markerElemet = document.querySelector('[data-marker]') as HTMLElement;
    const midRatio = (mid - start) / (end - start);
    markerElemet.style.setProperty('--rotation', (midRatio * 360).toString());
    return setInterval(() => {
      const now = Date.now();
      const ratio = (now - start) / (end - start);
      element.style.setProperty('--rotation', (ratio * 360).toString());
      element.style.setProperty('background-color', now < mid ? "green" : now < end ? "yellow" : "red");
    }, 50);
  };
  return <div className="clock">
    <div className="hand" data-hand></div>
    <div className="marker" data-marker></div>
  </div>
}