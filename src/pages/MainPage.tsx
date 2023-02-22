import '../App.css';
import React from 'react'
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Paper from '@mui/material/Paper';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { Record } from '../Interfaces';
import { RecordList } from '../Components';

export function MainPage(props: { rows: Record[] }) {
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
                    <RecordList records={props.rows} selectedTypes={selectedTypes} />
            }
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>

                <BottomNavigation showLabels value={0} >
                    <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
                    <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
                    <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
                </BottomNavigation>
            </Paper>
        </Paper>
    </ThemeProvider>)
}
