import React, { createContext, useContext } from "react";
import { darkTheme, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={darkTheme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): Theme {
  return useContext(ThemeContext);
}
