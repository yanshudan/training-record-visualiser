import { ThemeProvider, createTheme } from '@mui/material';
import '../App.css';
import { BottomNavBar } from '../utils/Components';
import { Record } from '../utils/Interfaces';
import React from 'react'

export function CalendarPage(props: { rows: Record[] }) {
  return (
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      This page is under construction
      <BottomNavBar selection={1} />
    </ThemeProvider>)
}