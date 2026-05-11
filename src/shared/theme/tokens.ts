import { Platform, StyleSheet } from "react-native";

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  hero: Platform.select({ ios: 52, android: 48, default: 52 }) ?? 52,
  title: 22,
  title2: 17,
  body: 16,
  caption: 13,
  micro: 11,
};

export const shadows = StyleSheet.create({
  card: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  }),
});

export const lightTheme = {
  bg: "#F2F2F7",
  bgElevated: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#636366",
  textTertiary: "#8E8E93",
  separator: "rgba(60, 60, 67, 0.18)",
  glassFill: "rgba(255, 255, 255, 0.72)",
  glassBorder: "rgba(255, 255, 255, 0.55)",
  overlay: "rgba(0, 0, 0, 0.45)",
  accent: "#4d0056",
  danger: "#FF3B30",
};

export const darkTheme = {
  bg: "#000000",
  bgElevated: "#1C1C1E",
  text: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textTertiary: "#8E8E93",
  separator: "rgba(84, 84, 88, 0.48)",
  glassFill: "rgba(28, 28, 30, 0.82)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  overlay: "rgba(0, 0, 0, 0.55)",
  accent: "#4d0056",
  danger: "#FF453A",
};

export type Theme = typeof lightTheme;
