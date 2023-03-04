import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import React from 'react'
import { Paper, Box } from '@mui/material';

const manuals = [
  {
    title: "Before You Start",
    content: <div>Record Visualiser doesn't collect or store your data.<br /> We use local storage in your browser to cache the changes.<br /> So your changes are persistent per session but will be lost on refresh.<br /> Please download your record periodically in case your data gets lost on refresh</div>
  },
  {
    title: "Get Started",
    content: <div>1. Duplicate and Edit a record on Record Tab<br /> 2. Export as local file</div>
  },
  {
    title: "Exporting Records",
    content: <div>Tap the donwload button on Record Tab to export your records. You can monifiy and import records afterwards as long as the file is in the same format.</div>
  },
  {
    title: "Importing Records",
    content: <div>Choose a file from you local drive. Download a sample file if you run into format errors.</div>
  },
  {
    title: "Viewing Statistics",
    content: <div>Switch between Chart Mode and Card Mode with the buttons on the right bottom</div>
  },
  {
    title: "Using Timers",
    content: <div>Set time  <br /> Start  <br /> Timeout  <br /> Restart</div>
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
    <Box height="100vh" sx={{ background: "#121212" }}>
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
    </Box>
  );
}
