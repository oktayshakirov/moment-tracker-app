import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  accentPresets,
  darkTheme,
  DEFAULT_ACCENT_ID,
  type AccentPreset,
  type Theme,
} from "./tokens";

const STORAGE_KEY = "accentColorId";

const ThemeContext = createContext<Theme>(darkTheme);

type ThemeController = {
  /** Id of the currently selected accent preset. */
  accentId: string;
  /** All accent presets the user can choose from. */
  presets: AccentPreset[];
  /** Select (and persist) a new accent preset. */
  setAccent: (id: string) => void;
};

const ThemeControllerContext = createContext<ThemeController>({
  accentId: DEFAULT_ACCENT_ID,
  presets: accentPresets,
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      if (id && accentPresets.some((p) => p.id === id)) setAccentId(id);
    });
  }, []);

  const setAccent = useCallback((id: string) => {
    setAccentId(id);
    void AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const theme = useMemo<Theme>(() => {
    const preset =
      accentPresets.find((p) => p.id === accentId) ?? accentPresets[0];
    return {
      ...darkTheme,
      accent: preset.accent,
      accentButton: preset.accentButton,
    };
  }, [accentId]);

  const controller = useMemo<ThemeController>(
    () => ({ accentId, presets: accentPresets, setAccent }),
    [accentId, setAccent],
  );

  return (
    <ThemeControllerContext.Provider value={controller}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeControllerContext.Provider>
  );
}

export function useAppTheme(): Theme {
  return useContext(ThemeContext);
}

export function useThemeController(): ThemeController {
  return useContext(ThemeControllerContext);
}
