import { useState } from "react";
import { Alert, Box, CircularProgress, Container, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { BottomNavBar, Section } from "./components/BottomNavBar";
import { useAppData } from "./state/AppDataContext";
import { TodayPage } from "./pages/TodayPage";
import { PlanPage } from "./pages/PlanPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { appBackground, energyGradient, useColorMode } from "./theme";

export function App() {
  const [section, setSection] = useState<Section>("today");
  const { loading, error } = useAppData();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <Box sx={{ pb: 9, minHeight: "100vh", background: appBackground(theme.palette.mode) }}>
      <Container maxWidth="md" sx={{ pt: 2 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
              background: energyGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "inline-block",
            }}
          >
            Training Record
          </Typography>
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Loading your training data…</Typography>
          </Stack>
        ) : (
          <>
            {section === "today" && <TodayPage />}
            {section === "plan" && <PlanPage />}
            {section === "exercises" && <ExercisesPage />}
            {section === "stats" && <StatsPage />}
            {section === "settings" && <SettingsPage />}
          </>
        )}
      </Container>
      <BottomNavBar section={section} onChange={setSection} />
    </Box>
  );
}
