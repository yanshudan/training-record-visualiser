import { Button, Paper, TextField } from '@mui/material';
import React from 'react';
import { setInterval } from 'timers';
import '../App.css';
import { Record } from '../utils/RecordSerializer';
import { ClockProps } from '../utils/Constants';

export function TimerPage(props: {
  rows: Record[],
  clockProps: ClockProps,
  setClockProps: (clockProps: ClockProps) => void,
  timer: NodeJS.Timer | undefined,
  setTimer: (timer: NodeJS.Timer|undefined) => void
}) {
  const [A, setA] = React.useState<number>(50);
  const [B, setB] = React.useState<number>(120);
  return <Paper>
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
      <Clock data={props.clockProps.data} timer={props.timer} setTimer={props.setTimer} />
    </Paper >
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "50px" }}>
      <TextField label="Train" type="number" onChange={(event) => setA(parseInt(event.target.value))} defaultValue={50} />
      <TextField label="Rest" type="number" onChange={(event) => setB(parseInt(event.target.value))} defaultValue={120} />
    </Paper>
    <Button sx={{ transform: "translateX(-50%)", left: "50%", transformOrigin: "center", width: "100px", height: "50px" }} variant="contained" onClick={() => {
      const now = Date.now();
      props.setClockProps({ data: { start: now, mid: now + A * 1000, end: now + (A + B) * 1000 } })
    }}>start</Button>
  </Paper>
}

export function Clock(props: ClockProps&{timer:NodeJS.Timer|undefined, setTimer: (timer: NodeJS.Timer|undefined) => void}) {
  const [info, setInfo] = React.useState<string>("Timer");
  React.useEffect(() => {
    const now = Date.now();
    if (props.timer) {
      clearInterval(JSON.parse(JSON.stringify(props.timer))._id);
    }
    const timer = setClock(props.data.start,props.data.mid,props.data.end);
    props.setTimer(timer);
  }, [props.data]);

  const setClock = (start: number, mid: number, end: number) => {
    if (end <= start) return;
    const element = document.querySelector('[data-hand]') as HTMLElement;
    const markerElemet = document.querySelector('[data-marker]') as HTMLElement;
    const midRatio = (mid - start) / (end - start);
    markerElemet.style.setProperty('--rotation', (midRatio * 360).toString());
    return setInterval(() => {
      const now = Date.now();
      const ratio = (now - start) / (end - start);
      if (ratio < midRatio) {
        setInfo(`${((mid - now) / 1000).toFixed(1)}`)
      } else if (ratio < 1) {
        setInfo(`${((end - now) / 1000).toFixed(1)}`)
      } else {
        setInfo(`${((now - end) / 1000).toFixed(1)}`)
      }

      element.style.setProperty('--rotation', (ratio * 360).toString());
      element.style.setProperty('background-color', now < mid ? "green" : now < end ? "yellow" : "red");
    }, 50);
  };
  return <div className="clock">
    <div className="hand" data-hand></div>
    <div className="marker" data-marker></div>
    <h2 style={{
      position: "relative",
      width: "fit-content",
      left: "50%",
      transform: "translateX(-50%)",
      margin: "0px"
    }}>{info}</h2>
  </div>
}