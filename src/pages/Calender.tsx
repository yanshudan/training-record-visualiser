import { ThemeProvider, createTheme } from '@mui/material';
import '../App.css';
import { BottomNavBar } from '../utils/Components';
import React from 'react'
import { Record } from '../utils/RecordSerializer';

export function CalendarPage(props: { rows: Record[] }) {
  return (
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      This page is under construction
    </ThemeProvider>)
}