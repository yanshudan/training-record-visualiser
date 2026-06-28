import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, PaletteMode, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { AppDataProvider } from "./state/AppDataContext";
import { ColorModeContext, createAppTheme } from "./theme";

const COLOR_MODE_KEY = "trv:colorMode";

function Root() {
  const [mode, setMode] = useState<PaletteMode>(
    () => (localStorage.getItem(COLOR_MODE_KEY) as PaletteMode | null) ?? "dark"
  );

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => {
          const next: PaletteMode = prev === "dark" ? "light" : "dark";
          localStorage.setItem(COLOR_MODE_KEY, next);
          return next;
        }),
    }),
    [mode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <AppDataProvider>
              <App />
            </AppDataProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
