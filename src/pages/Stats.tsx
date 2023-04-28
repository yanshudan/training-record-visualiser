import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentIcon from '@mui/icons-material/Payment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { Alert, Box, Paper } from '@mui/material';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import '../App.css';
import { movementDefinitions, movementToPart } from '../utils/Constants';
import { BodyStatus, Plan, PlanMeta, Record } from '../utils/RecordSerializer';
import { MyComposedChart } from './ChartView';
import { RecordList } from '../components/RecordList';
import { Activities } from './Activities';
import { ActivitySliders } from '../components/ActivitySliders';
import { Planner } from './Planner';

export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set([...movementDefinitions.keys()]);
  const allTypes = Array.from(allTypesSet.values());
  const savedPlan: Plan = JSON.parse(localStorage.getItem("plan") || "{}") as Plan;
  const [renderType, setRenderType] = React.useState<"cards" | "chart" | "rings" | "plan">("rings");
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(["卧推"]);
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(filterRows(props.rows, selectedType, selectedMovements));
  const [planMeta, setPlanMetaRaw] = React.useState<PlanMeta>(savedPlan.planMeta || new PlanMeta());
  const [current, setCurrentRaw] = React.useState<BodyStatus>(savedPlan.current || { weight: 70, fat: 10, FFMI: 0 });
  const [target, setTargetRaw] = React.useState<BodyStatus>(savedPlan.target || { weight: 0, fat: 10, FFMI: 22 });

  const setPlanMeta = (newPlanMeta: PlanMeta) => {
    setPlanMetaRaw(newPlanMeta);
    localStorage.setItem("plan", JSON.stringify({ planMeta: newPlanMeta, current: current, target: target }));
  }
  const setCurrent = (newCurrent: BodyStatus) => {
    setCurrentRaw(newCurrent);
    localStorage.setItem("plan", JSON.stringify({ planMeta: planMeta, current: newCurrent, target: target }));
  }
  const setTarget = (newTarget: BodyStatus) => {
    setTargetRaw(newTarget);
    localStorage.setItem("plan", JSON.stringify({ planMeta: planMeta, current: current, target: newTarget }));
  }
  //TODO: save plan configs
  //TODO: add daily expectations
  return (<Box height="200vh" sx={{ background: "#121212" }}>
    <Paper>
      {renderType !== "rings" && renderType !== "plan" && <Stack direction="row" spacing={1} >
        <div>{
          allTypes.map((type) => {
            return <Chip label={type} onClick={() => {
              setSelectedType(type);
              setSelectedMovements([]);
              setFilteredRows(filterRows(props.rows, type, selectedMovements));
            }} color={selectedType === type ? "success" : "info"} />
          })}
        </div>
      </Stack>}
      {renderType !== "rings" && renderType !== "plan" &&
        <Stack sx={{ marginTop: "10px", marginBottom: "20px" }}>
          <div>{
            movementDefinitions.get(selectedType)!.movements.map((name) => {
              return <Chip label={name} onClick={() => {
                let newMovements;
                if (selectedMovements.includes(name)) {
                  newMovements = selectedMovements.filter((movement) => movement !== name);
                } else {
                  newMovements = [...selectedMovements, name];
                }
                setSelectedMovements(newMovements);
                setFilteredRows(filterRows(props.rows, selectedType, newMovements))
              }} color={selectedMovements.includes(name) ? "success" : "info"} />
            })
          }</div>
        </Stack>}
      {renderType === "chart" &&
        (filteredRows.length <= 1 ? <Alert severity="warning">Not enough data to render graph, create more than 2 records containing the same movement to see the chart</Alert> :
          <MyComposedChart filteredRows={filteredRows} />)}
      {renderType === "cards" &&
        <RecordList records={filteredRows} selectedTypes={allTypes} setRecords={() => { }} editable={false} />}
      {renderType === "rings" && <>
        <Activities
          records={props.rows}
          current={current}
          target={target}
          planMeta={planMeta} />
        <ActivitySliders
          planMeta={planMeta}
          setPlanMeta={setPlanMeta} />
      </>}
      {renderType === "plan" &&
        <Planner
          current={current}
          setCurrent={setCurrent}
          target={target}
          setTarget={setTarget}
          planMeta={planMeta}
          setPlanMeta={setPlanMeta} />}
    </Paper>
    <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
      <ToggleButtonGroup exclusive={true} aria-label="text alignment" >
        <ToggleButton value="planner" selected={renderType === "plan"} onClick={() => setRenderType("plan")}>
          <CalendarMonthIcon />
        </ToggleButton>
        <ToggleButton value="left" selected={renderType === "rings"} onClick={() => setRenderType("rings")}>
          <TrackChangesIcon />
        </ToggleButton>
        <ToggleButton value="center" selected={renderType === "chart"} onClick={() => setRenderType("chart")}>
          <AutoGraphIcon />
        </ToggleButton>
        <ToggleButton value="right" selected={renderType === "cards"} onClick={() => setRenderType("cards")}>
          <PaymentIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  </Box>)
}

function filterRows(rows: Record[], selectedType: string, selectedMovements: string[]) {
  return rows.map(
    (row) => {
      return {
        date: row.date,
        movements: row.movements.filter((movement) => movementToPart.get(movement.name) === selectedType && (selectedMovements.includes(movement.name))),
        topic: row.topic,
        comment: row.comment
      }
    }
  ).filter((row) => row.movements.length > 0);
}