import CallMergeIcon from '@mui/icons-material/CallMerge';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogProps, DialogTitle, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
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
import { today } from '../utils/Constants';

export function MainPage(props: { rows: Record[], setRows: (records: Record[]) => void }) {
  const [allTypes, setAllTypes] = React.useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(["Chest"]);
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState<DialogProps['scroll']>('paper');
  const [value, setValue] = React.useState<string>("");


  React.useEffect(() => {
    const newAllTypes = new Set(props.rows.map((row) => row.topic));
    setAllTypes(newAllTypes)
    setSelectedTypes(selectedTypes.filter((selectedType) => newAllTypes.has(selectedType)))
  }, [props.rows])

  const hiddenFileInput = React.useRef<HTMLInputElement|null>(null);
  const descriptionElementRef = React.useRef<HTMLElement>(null);

  const handleClick = () => {
    if(hiddenFileInput.current===null) return;
    hiddenFileInput.current.click();
  };
  const handleChange = (event:any) => {
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
      })
      props.setRows(newRows)
    }
    if (event.target === null || event.target.files === null) return;
    reader.readAsText(event.target.files[0])
  }

  const handleClickOpen = (scrollType: DialogProps['scroll']) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const mergeRecords = (value:string) => {
    const newRows = RecordSerializer.deserialize(value);
    props.setRows([...newRows, ...props.rows].sort((a, b) => b.date.getTime() - a.date.getTime()))
    setOpen(false);
  }
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
        <RecordList records={props.rows} selectedTypes={selectedTypes} setRecords={props.setRows} editable/>
      </Paper>
      <Paper sx={{ position: 'fixed', bottom: 60, right: 10 }}>
        <ToggleButtonGroup aria-label="text alignment" >
          <ToggleButton value="left" onClick={handleClickOpen("paper")}>
            <CallMergeIcon />
          </ToggleButton>
          <ToggleButton value="center" onClick={handleClick}>
            <input type="file" ref={hiddenFileInput} onChange={handleChange} style={{display:'none'}}/>
            <FileUploadIcon />
          </ToggleButton>
          <ToggleButton value="right" onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([props.rows.map(row => RecordSerializer.serialize(row)).join("\n\n")], { type: "text/plain" }));
            a.setAttribute("download", `records-${today.toISOString()}.txt`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}>
            <DownloadIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>
      <Dialog
        open={open}
        onClose={() => { setOpen(false) }}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Merge Records</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
          >
            Merge your new recodes with existing ones.
          </DialogContentText>
          <TextField multiline fullWidth onChange={(newVal) => { setValue(newVal.target.value) }} ></TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>{setOpen(false)}}>Cancel</Button>
        <Button onClick={() => { setOpen(false);mergeRecords(value)}}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Paper>)
}
