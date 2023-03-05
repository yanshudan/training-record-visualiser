import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentIcon from '@mui/icons-material/Payment';
import { Alert, Box, Paper } from '@mui/material';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import '../App.css';
import { Activities, MyComposedChart, Planner, RecordList } from '../utils/Components';
import { movementDefinitions, movementToPart } from '../utils/Constants';
import { BodyStatus, PlanMeta, Record } from '../utils/RecordSerializer';

export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set(movementDefinitions.map((definition) => definition.part));
  const allTypes = Array.from(allTypesSet.values());
  const [renderType, setRenderType] = React.useState<"cards" | "chart" | "rings">("rings");
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(["卧推"]);
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(filterRows(props.rows, selectedType, selectedMovements));
  const [planMeta, setPlanMeta] = React.useState<PlanMeta>(new PlanMeta());
  const [current, setCurrent] = React.useState<BodyStatus>({ weight: 70, fat: 10, FFMI: 0 });
  const [target, setTarget] = React.useState<BodyStatus>({ weight: 0, fat: 10, FFMI: 22 });
//TODO: save plan configs
//TODO: add daily expectations
  return (<Box height="150vh" sx={{ background: "#121212" }}>
    <Paper>
      {renderType !== "rings" && <Stack direction="row" spacing={1} >
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
      {renderType !== "rings" &&
        <Stack sx={{ marginTop: "10px", marginBottom: "20px" }}>
          <div>{
            movementDefinitions.filter((definition) => definition.part === selectedType)[0].movements.map((name) => {
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
      {renderType === "chart" ?
        (filteredRows.length <= 1 ? <Alert severity="warning">Not enough data to render graph, create more than 2 records containing the same movement to see the chart</Alert> :
          <MyComposedChart filteredRows={filteredRows} />
        ) : renderType === "cards" ?
          <RecordList records={filteredRows} selectedTypes={allTypes} setRecords={() => { }} editable={false} /> :
          <>
            <Activities records={props.rows} />
            <Planner
              current={current}
              setCurrent={setCurrent}
              target={target}
              setTarget={setTarget}
              planMeta={planMeta}
              setPlanMeta={setPlanMeta}
            />
          </>
      }
    </Paper>
    <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
      <ToggleButtonGroup exclusive={true} aria-label="text alignment" >
        <ToggleButton value="left" selected={renderType === "rings"} onClick={() => setRenderType("rings")}>
          <CalendarMonthIcon />
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
        topic: row.topic
      }
    }
  ).filter((row) => row.movements.length > 0);
}