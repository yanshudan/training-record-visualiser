import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import React from 'react';
import '../App.css';
import { movementDefinitions, movementToPart, today } from '../utils/Constants';
import { Movement, Record, RecordSerializer, UnitEnum } from '../utils/RecordSerializer';

export function Movements(props: {
    movements: Movement[];
}) {
    return <div>
        {
            props.movements.map((movement) => {
                return (<Typography sx={{ mb: 1.5 }}>
                    {RecordSerializer.serializeMovement(movement)}
                </Typography>)
            })}
    </div>
};

export function RecordList(props: {
    records: Record[],
    setRecords: (records: Record[]) => void,
    selectedTypes: string[]
    editable: boolean
}) {
    const showPlaceHolderCard = props.editable || props.records.length === 0;
    return (<div>
        {props.records.filter(
            (record) => props.selectedTypes.includes(record.topic) && record.movements.length > 0
        ).map((record) => {
            return (<div>
                <EditableCard
                    record={record}
                    editable={props.editable}
                    onDelete={() => { props.setRecords(props.records.filter((r) => r !== record)) }}
                    onDuplicateEmpty={() => {
                        props.setRecords([{
                            date: today,
                            topic: record.topic,
                            comment: "",
                            movements: record.movements.map((movement: Movement) => {
                                return {
                                    ...movement,
                                    sets: [{ ...(movement.sets[0]), reps: 1 }],
                                    comment: ""
                                }
                            })
                        }, ...props.records,])
                    }}
                    onUpdate={(newRecord: Record, updateMeta: boolean) => {
                        props.setRecords(props.records.map((r) => { return r === record ? (updateMeta ? newRecord : { ...newRecord, topic: record.topic, date: record.date }) : r }))
                    }} />
            </div>)
        })}
        {showPlaceHolderCard && <Card sx={{ "border-radius": "10px", "margin-bottom": "1px", height: "200px" }} variant="outlined">
            <CardContent sx={{ "padding-bottom": "0px" }}>
                <Typography variant="h5" component="div" display="inline-block" onClick={() => {
                    const firstSelectedPart = movementDefinitions.get(movementToPart.get(props.selectedTypes[0]) || "");
                    const useDefault = props.selectedTypes.length === 0 || firstSelectedPart === undefined;
                    props.setRecords([{
                        date: today,
                        comment: "Comments",
                        topic: useDefault ? "Legs" : props.selectedTypes[0],
                        movements: [{
                            name: useDefault ? "深蹲" : firstSelectedPart.movements[0],
                            comment: "Comments",
                            sets: [
                                {
                                    weight: 20,
                                    reps: 10,
                                    unit: UnitEnum.kg
                                },
                                {
                                    weight: 20,
                                    reps: 10,
                                    unit: UnitEnum.kg
                                },
                                {
                                    weight: 30,
                                    reps: 10,
                                    unit: UnitEnum.lb
                                },
                                {
                                    weight: 30,
                                    reps: 8,
                                    unit: UnitEnum.lb
                                },
                            ]
                        }]
                    }, ...props.records,])
                    if (useDefault) {
                        alert("Tap 'Legs' to see your new record")
                    }
                }}>
                    {props.editable ? "Create a new record from template" : "No records found"}
                </Typography>
            </CardContent>
        </Card>}
    </div>)
}

export function EditableCard(props: {
    record: Record,
    editable: boolean,
    onDelete: () => void,
    onDuplicateEmpty: () => void,
    onUpdate: (record: Record, updateMeta: boolean) => void
}) {
    const [showEditor, setShowEditor] = React.useState(false);
    const [value, setValue] = React.useState<string>(RecordSerializer.serialize(props.record));
    const [openClearReps, setOpenClearReps] = React.useState(false);
    const [openDelete, setOpenDelete] = React.useState(false);

    return <Card sx={{ "border-radius": "10px", "margin-bottom": "1px" }} variant="outlined">
        {showEditor ?
            <TextField
                defaultValue={RecordSerializer.serialize(props.record)}
                multiline
                fullWidth
                onChange={(newVal) => {
                    setValue(newVal.target.value)
                    try {
                        const newRecord = RecordSerializer.parseRecord(newVal.target.value)
                        newRecord && props.onUpdate(newRecord, false);
                    } catch (e) {
                    }
                }} /> :
            <CardContent sx={{ "padding-bottom": "0px" }} onClick={() => { setShowEditor(true) }}>
                <Typography variant="h5" component="div" display="inline-block">
                    {props.record.topic}
                </Typography>
                <Typography sx={{ fontSize: 14, "padding-left": "8px" }} color="text.secondary" display="inline-block" gutterBottom>
                    {props.record.date.getMonth() + 1 + "/" + props.record.date.getDate()}
                </Typography>
                <Movements movements={props.record.movements} />
            </CardContent>}
        <Divider />
        <CardActions>
            <Button
                size="small"
                disabled={!props.editable}
                onClick={() => {
                    if (!showEditor) {
                        setShowEditor(true);
                        setValue(RecordSerializer.serialize(props.record));
                    }
                    else {
                        setShowEditor(false);
                        const newRecord = RecordSerializer.parseRecord(value);
                        newRecord && props.onUpdate(newRecord, true);
                    }
                }}>{showEditor ? "Confirm" : "Edit"}</Button>
            <Button size="small" onClick={props.onDuplicateEmpty} disabled={!props.editable || showEditor}>Start Another</Button>
            <Button size="small" onClick={() => {
                setOpenDelete(true);
            }} disabled={!props.editable || showEditor}>Delete</Button>
            <ConfirmDialog
                open={openDelete}
                title="Delete Record"
                content="Are you sure you want to delete this record?"
                onClose={(confirmed: boolean) => {
                    setOpenDelete(false)
                    if (!confirmed) return;
                    props.onDelete()
                }} />
        </CardActions>
    </Card>
}

export function ConfirmDialog(props: { open: boolean, onClose: (confirmed: boolean) => void, title: string, content: string }) {
    return <Dialog
        open={props.open}
        onClose={() => props.onClose(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
    >
        <DialogTitle id="alert-dialog-title">
            {props.title}
        </DialogTitle>
        <DialogContent>
            <DialogContentText id="alert-dialog-description">
                {props.content}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => props.onClose(true)}>Confirm</Button>
            <Button onClick={() => props.onClose(false)} autoFocus> Cancel </Button>
        </DialogActions>
    </Dialog>
}