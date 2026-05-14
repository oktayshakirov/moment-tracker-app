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
      shadowColor: "#1A3A5C",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 28,
    },
    android: { elevation: 5 },
    default: {},
  }),
});

/** Single app theme — dark only */
export const darkTheme = {
  bg: "#0C0E14",
  bgElevated: "rgba(28, 28, 32, 0.94)",
  text: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textTertiary: "#8E8E93",
  separator: "rgba(84, 84, 88, 0.42)",
  glassFill: "rgba(32, 36, 44, 0.65)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  glassTintGradient: ["rgba(48,56,68,0.78)", "rgba(18,24,34,0.9)"] as [
    string,
    string,
  ],
  screenGradient: ["#0E1118", "#151B26"] as [string, string],
  overlay: "rgba(0, 0, 0, 0.55)",
  accent: "#5EB8FF",
  danger: "#FF453A",
};

export type Theme = typeof darkTheme;
