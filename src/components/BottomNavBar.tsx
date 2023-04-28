
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import TimerIcon from '@mui/icons-material/Timer';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import React from 'react';
import '../App.css';

export function BottomNavBar(props: { selection: number, setSection: React.Dispatch<React.SetStateAction<number>> }) {
  return (<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
    <BottomNavigation showLabels value={props.selection} >
      <BottomNavigationAction onClick={() => props.setSection(0)} label="Records" icon={<FormatListBulletedIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(1)} label="Timer" icon={<TimerIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(2)} label="Statistics" icon={<SsidChartIcon />} />
      <BottomNavigationAction onClick={() => props.setSection(3)} label="Manual" icon={<HelpOutlineIcon />} />
    </BottomNavigation>
  </Paper>)
}
