import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import TuneIcon from "@mui/icons-material/Tune";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";

export type Section = "today" | "plan" | "exercises" | "stats" | "settings";

export function BottomNavBar({
  section,
  onChange,
}: {
  section: Section;
  onChange: (s: Section) => void;
}) {
  return (
    <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10 }} elevation={8}>
      <BottomNavigation
        showLabels
        value={section}
        onChange={(_, value) => onChange(value as Section)}
      >
        <BottomNavigationAction label="Today" value="today" icon={<TodayIcon />} />
        <BottomNavigationAction label="Plan" value="plan" icon={<TuneIcon />} />
        <BottomNavigationAction label="Exercises" value="exercises" icon={<FitnessCenterIcon />} />
        <BottomNavigationAction label="Stats" value="stats" icon={<InsightsIcon />} />
        <BottomNavigationAction label="Settings" value="settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
