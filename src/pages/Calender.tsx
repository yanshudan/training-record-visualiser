import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { Record } from '../Interfaces';
import '../App.css';
import React from 'react'

export function CalendarPage(props: { rows: Record[] }) {
    return (<div>This page is under construction<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>

        <BottomNavigation showLabels value={1} >
            <BottomNavigationAction href="/" label="Records" icon={<FormatListBulletedIcon />} />
            <BottomNavigationAction href="/calendar" label="Calendar" icon={<CalendarMonthIcon />} />
            <BottomNavigationAction href="/stat" label="Statistics" icon={<SsidChartIcon />} />
        </BottomNavigation>
    </Paper></div>)
}