import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const ColorModeContext = createContext({
  mode: "dark",
  toggleColorMode: () => {}
});

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("habitflow_theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("habitflow_theme", mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#2e7d32" },
                secondary: { main: "#66bb6a" },
                background: { default: "#f8fbf8", paper: "#ffffff" },
                text: { primary: "#1d2b1f", secondary: "#4b6350" }
              }
            : {
                primary: { main: "#2563eb" },
                secondary: { main: "#60a5fa" },
                background: { default: "#05070d", paper: "#0f172a" },
                text: { primary: "#e2e8f0", secondary: "#94a3b8" }
              })
        },
        shape: { borderRadius: 10 },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                border:
                  mode === "light" ? "1px solid #d5e6d6" : "1px solid #1e293b"
              }
            }
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                borderBottom:
                  mode === "light" ? "1px solid #d5e6d6" : "1px solid #1e293b"
              }
            }
          }
        }
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
