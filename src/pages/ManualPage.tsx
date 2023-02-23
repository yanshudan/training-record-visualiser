import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import React from 'react'
import Paper from '@mui/material/Paper';

const manuals = [
  {
    title: "Record",
    content: <div>//TODO</div>
  },
  {
    title: "Importing Records",
    content: <div>//TODO</div>
  },
  {
    title: "Exporting Records",
    content: <div>//TODO</div>
  },
  {
    title: "Viewing Statistics",
    content: <div>//TODO</div>
  },
  {
    title: "Using Timers",
    content: <div>Set time  <br/> Start  <br/> Timeout  <br/> Restart</div>
  },
  {
    title: "Contribute & Feedback",
    content: <div>Open issue or create a fork in <a href='https://github.com/yanshudan/training-record-visualiser'>github repo</a></div>
  },
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
          <Accordion expanded={expanded === manual.title} onChange={handleChange(manual.title)}>
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
