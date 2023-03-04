import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PaymentIcon from '@mui/icons-material/Payment';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import { Alert } from '@mui/material';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import '../App.css';
import { Activities, MyComposedChart, RecordList } from '../utils/Components';
import { movementDefinitions, movementToPart, oneday, today } from '../utils/Constants';
import { Record } from '../utils/RecordSerializer';

export function StatsPage(props: { rows: Record[] }) {
  const allTypesSet = new Set(movementDefinitions.map((definition) => definition.part));
  const allTypes = Array.from(allTypesSet.values());
  const [renderType, setRenderType] = React.useState<"cards" | "chart" | "rings">("rings");
  const [selectedType, setSelectedType] = React.useState<string>("Chest");
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(["卧推"]);
  const [filteredRows, setFilteredRows] = React.useState<Record[]>(filterRows(props.rows, selectedType, selectedMovements));

  return (<Paper>
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
          <Activities records={props.rows} />}
    </Paper>
    <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
      <ToggleButtonGroup exclusive={true} aria-label="text alignment" >
        <ToggleButton value="left" selected={renderType === "rings"} onClick={() => setRenderType("rings")}>
          <WifiTetheringIcon />
        </ToggleButton>
        <ToggleButton value="center" selected={renderType === "chart"} onClick={() => setRenderType("chart")}>
          <AutoGraphIcon />
        </ToggleButton>
        <ToggleButton value="right" selected={renderType === "cards"} onClick={() => setRenderType("cards")}>
          <PaymentIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  </Paper>)
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