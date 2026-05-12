import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(
    () => (scheme === "dark" ? darkTheme : lightTheme),
    [scheme],
  );
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): Theme {
  return useContext(ThemeContext);
}
