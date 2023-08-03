import { Box, Button, Paper, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import React from 'react';
import { setInterval } from 'timers';
import '../App.css';
import { ClockProps } from '../utils/Constants';

const kg2lb = 2.20462262;
const barInKg = 20;

export function TimerPage(props: {
  clockProps: ClockProps,
  setClockProps: (clockProps: ClockProps) => void,
  timer: NodeJS.Timer | undefined,
  setTimer: (timer: NodeJS.Timer | undefined) => void,
  stepA: number,
  setStepA: (stepA: number) => void,
  stepB: number,
  setStepB: (stepB: number) => void,
}) {
  const [A, setA] = React.useState(props.stepA);
  const [B, setB] = React.useState(props.stepB);
  return <Box height="100vh" sx={{ background: "#121212" }}>
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
      <Clock data={props.clockProps.data} timer={props.timer} setTimer={props.setTimer} />
    </Paper >
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "50px" }}>
      <TextField label="Train" type="number" onChange={(event) => setA(parseInt(event.target.value))} defaultValue={props.stepA} />
      <TextField label="Rest" type="number" onChange={(event) => setB(parseInt(event.target.value))} defaultValue={props.stepB} />
    </Paper>
    <Button sx={{ transform: "translateX(-50%)", left: "50%", transformOrigin: "center", width: "100px", height: "50px" }} variant="contained" onClick={() => {
      const now = Date.now();
      props.setClockProps({ data: { start: now, mid: now + A * 1000, end: now + (A + B) * 1000 } })
      props.setStepA(A);
      props.setStepB(B);
    }}>start</Button>
    <Calculator />
  </Box>
}

export function Clock(props: ClockProps & { timer: NodeJS.Timer | undefined, setTimer: (timer: NodeJS.Timer | undefined) => void }) {
  const [info, setInfo] = React.useState<string>("Timer");
  React.useEffect(() => {
    const now = Date.now();
    if (props.timer) {
      clearInterval(JSON.parse(JSON.stringify(props.timer))._id);
    }
    const timer = setClock(props.data.start, props.data.mid, props.data.end);
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

export function Calculator() {
  const [totalkg, setTotalkg] = React.useState(0);
  const [totallb, setTotallb] = React.useState(0);
  const [sidekg, setSidekg] = React.useState(0);
  const [sidelb, setSidelb] = React.useState(0);

  return <div>
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "50px" }}>
      <TextField
        label="Total"
        type="number"
        InputProps={{
          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
        }}
        onChange={(event) => {
          setTotalkg(parseInt(event.target.value))
          setSidekg((parseInt(event.target.value) - barInKg) / 2)
          setTotallb(parseInt(event.target.value) * kg2lb)
          setSidelb((parseInt(event.target.value) - barInKg) / 2 * kg2lb)
        }}
        value={totalkg} />
      <TextField
        label="Side"
        type="number"
        InputProps={{
          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
        }}
        onChange={(event) => {
          setTotalkg(parseInt(event.target.value) * 2 + barInKg)
          setSidekg(parseInt(event.target.value))
          setTotallb((parseInt(event.target.value) * 2 + barInKg) * kg2lb)
          setSidelb(parseInt(event.target.value) * kg2lb)
        }}
        value={sidekg} />
    </Paper>
    <Paper sx={{ alignItems: "center", display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "50px" }}>
      <TextField
        label="Total"
        type="number"
        InputProps={{
          endAdornment: <InputAdornment position="end">lb</InputAdornment>,
        }}
        onChange={(event) => {
          setTotalkg(parseInt(event.target.value) / kg2lb)
          setSidekg((parseInt(event.target.value) / kg2lb - barInKg) / 2)
          setTotallb(parseInt(event.target.value))
          setSidelb((parseInt(event.target.value) - barInKg * kg2lb) / 2)
        }}
        value={totallb} />
      <TextField
        label="Side"
        type="number"
        InputProps={{
          endAdornment: <InputAdornment position="end">lb</InputAdornment>,
        }}
        onChange={(event) => {
          setTotalkg((parseInt(event.target.value) / kg2lb * 2 + barInKg))
          setSidekg(parseInt(event.target.value) / kg2lb)
          setTotallb((parseInt(event.target.value) * 2 + barInKg * kg2lb))
          setSidelb(parseInt(event.target.value))
        }}
        value={sidelb} />
    </Paper>
  </div>

}