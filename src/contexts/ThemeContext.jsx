import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme } from "@mui/material/styles";

const ThemeContext = createContext({ mode: "dark", toggleTheme: () => {}, theme: null });

const getInitialMode = () => {
  try {
    const stored = localStorage.getItem("theme_mode");
    if (stored === "light" || stored === "dark") return stored;
  } catch (_) {}
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return "dark";
  }
  return "light";
};

export const ThemeProviderApp = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try { localStorage.setItem("theme_mode", mode); } catch (_) {}
    const root = document.documentElement; // <html>
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [mode]);

  const toggleTheme = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#000000" : "#6d28d9" },
      success: { main: "#059669" },
      warning: { main: "#d97706" },
      info: { main: "#3b82f6" },
      background: {
        default: mode === "dark" ? "#000000" : "#ffffff",
        paper: mode === "dark" ? "#0f172a" : "#f8fafc",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#0f172a",
        secondary: mode === "dark" ? "#cbd5e1" : "#475569",
      },
      divider: mode === "dark" ? "#1f2937" : "#e2e8f0",
    },
    shape: { borderRadius: 12 },
  }), [mode]);

  const value = useMemo(() => ({ mode, toggleTheme, theme }), [mode, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeApp = () => useContext(ThemeContext);
export default ThemeContext;
