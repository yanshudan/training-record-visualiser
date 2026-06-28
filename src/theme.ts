import { createContext, useContext } from "react";
import { createTheme, PaletteMode } from "@mui/material";

// Orange → yellow "energy" gradient drives the app's visual identity. Use this
// for hero surfaces, primary call-to-actions and accents.
export const energyGradient = "linear-gradient(135deg, #ff7a00 0%, #ffc400 100%)";

// Page backdrop: a warm orange glow over a warm, orange-tinted base (never pure
// black or white) in either mode.
export function appBackground(mode: PaletteMode): string {
  return mode === "dark"
    ? "radial-gradient(1200px 460px at 50% -8%, rgba(255,138,0,0.34), rgba(255,196,0,0.10) 38%, transparent 72%), #1c130b"
    : "radial-gradient(1200px 460px at 50% -8%, rgba(255,138,0,0.28), rgba(255,196,0,0.18) 38%, transparent 72%), #f0e2cd";
}

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#ff7a00" },
      secondary: { main: "#ffc400" },
      background:
        mode === "dark"
          ? { default: "#1c130b", paper: "#2a1d11" }
          : { default: "#f0e2cd", paper: "#faf0df" },
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
