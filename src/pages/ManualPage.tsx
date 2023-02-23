import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import React from 'react'
import Paper from '@mui/material/Paper';

const manuals = [
  {
    key: "panel1",
    title: "How to use this app",
    content: "This app is designed to help you track your progress in the gym. You can add new records by clicking the + button in the bottom right"
  },
  {
    key: "panel2",
    title: "How to use thids app",
    content: "This app is designed to help you track dsfsdgdfgyour progress in the gym. You can add new records by clicking the + button in the bottom right"
  },
  {
    key: "panel3",
    title: "How to use tsahis app",
    content: "This app is designed tfdsao help you track your progress in the gym. You can add new records by clicking the + button in the bottom right"
  }
]

export function ManualPage() {
  const [expanded, setExpanded] = React.useState<string | false>(false);
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  return (
    <Paper>
      {manuals.map((manual) => {
        return (
          <Accordion expanded={expanded === manual.key} onChange={handleChange(manual.key)}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>{manual.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{manual.content}</Typography>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Paper>
  );
}
