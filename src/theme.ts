import { createContext, useContext } from "react";
import { createTheme, PaletteMode } from "@mui/material";

// Orange → yellow "energy" gradient drives the app's visual identity. Use this
// for hero surfaces, primary call-to-actions and accents.
export const energyGradient = "linear-gradient(135deg, #ff7a00 0%, #ffc400 100%)";

// Page backdrop: a warm orange glow over a dark or light base depending on mode.
export function appBackground(mode: PaletteMode): string {
  return mode === "dark"
    ? "radial-gradient(1200px 420px at 50% -8%, rgba(255,138,0,0.20), rgba(255,196,0,0.05) 35%, transparent 70%), #0b0b0d"
    : "radial-gradient(1200px 420px at 50% -8%, rgba(255,138,0,0.16), rgba(255,196,0,0.10) 35%, transparent 70%), #f5f5f2";
}

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#ff7a00" },
      secondary: { main: "#ffc400" },
      background:
        mode === "dark"
          ? { default: "#0b0b0d", paper: "#16161a" }
          : { default: "#f5f5f2", paper: "#ffffff" },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
  });
}

export interface ColorModeContextValue {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "dark",
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);
