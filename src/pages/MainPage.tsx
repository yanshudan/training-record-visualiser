import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import '../App.css';
import { RecordList } from '../utils/Components';
import { Record, RecordSerializer } from '../utils/RecordSerializer';
import { DetectTopic } from '../utils/Utils';
import Alert from '@mui/material/Alert';

export function MainPage(props: { rows: Record[], setRows: (records: Record[]) => void }) {
  const [allTypes, setAllTypes] = React.useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  React.useEffect(() => {
    const newAllTypes = new Set(props.rows.map((row) => row.topic));
    setAllTypes(newAllTypes)
    setSelectedTypes(selectedTypes.filter((selectedType) => newAllTypes.has(selectedType)))
  }, [props.rows])

  return (
    <Paper>
      <Paper>
        <Stack direction="row" spacing={1} >
          <div>{
            Array.from(allTypes.values()).map((type) => {
              return <Chip label={type} onClick={() => {
                if (selectedTypes.includes(type)) {
                  setSelectedTypes(selectedTypes.filter((selectedType) => selectedType !== type))
                } else {
                  setSelectedTypes([...selectedTypes, type])
                }
              }} color={selectedTypes.includes(type) ? "success" : "info"} />
            })}
          </div>
        </Stack>
        {(selectedTypes.length === 0 && allTypes.size !== 0) ? <Alert severity="warning">Please select a record type!</Alert> : null}
        <RecordList records={props.rows} selectedTypes={selectedTypes} setRecords={props.setRows} />
      </Paper>
      <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
        <ToggleButtonGroup aria-label="text alignment" >
          <ToggleButton value="left" >
            <input type="file" onChange={(event) => {
              event.preventDefault();
              const reader = new FileReader();
              reader.onload = async (event) => {
                if (event.target === null) return;
                const text = event.target.result as string;
                const newRows = RecordSerializer.deserialize(text).reverse().map((record) => {
                  return {
                    date: record.date,
                    topic: DetectTopic(record.movements) as string,
                    movements: record.movements
                  }
                });
                props.setRows(newRows)
              }
              if (event.target === null || event.target.files === null) return;
              reader.readAsText(event.target.files[0])
            }} />
            <FileUploadIcon />
          </ToggleButton>
          <ToggleButton value="center" onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([props.rows.map(row => RecordSerializer.serialize(row)).join("\n\n")], { type: "text/plain" }));
            a.setAttribute("download", `records-${new Date().toISOString()}.txt`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}>
            <DownloadIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>
    </Paper>)
}
