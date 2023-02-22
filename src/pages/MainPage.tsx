import { ThemeProvider } from '@emotion/react';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { createTheme } from '@mui/material';
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
export function MainPage(props: { rows: Record[], setRows: React.Dispatch<React.SetStateAction<Record[]>> }) {
  const allTypes = new Set(props.rows.map((row) => row.topic));
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  return (<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
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
      {
        selectedTypes.length === 0 ? "Select a type" :
          <RecordList records={props.rows} selectedTypes={selectedTypes} setRecords={props.setRows} />
      }
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
        <ToggleButton value="center" >
          <DownloadIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  </ThemeProvider>)
}
