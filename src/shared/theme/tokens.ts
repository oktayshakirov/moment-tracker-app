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
      shadowColor: "#2A6080",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 28,
    },
    android: { elevation: 5 },
    default: {},
  }),
});

/** Single app theme — dark only; palette sampled from assets/icon.png */
export const darkTheme = {
  bg: "#1C2127",
  bgElevated: "rgba(36, 42, 50, 0.94)",
  text: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textTertiary: "#8E8E93",
  separator: "rgba(84, 84, 88, 0.42)",
  glassFill: "rgba(38, 44, 52, 0.65)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  glassTintGradient: ["rgba(48, 58, 68, 0.78)", "rgba(20, 25, 27, 0.9)"] as [
    string,
    string,
  ],
  screenGradient: ["#1C2127", "#14191B"] as [string, string],
  overlay: "rgba(0, 0, 0, 0.55)",
  accent: "#60D4FC",
  /** Darker icon blue for filled buttons — better contrast with white label text */
  accentButton: "#2898CB",
  danger: "#FF453A",
};

export type Theme = typeof darkTheme;

/** A user-selectable accent color (and its darker filled-button variant). */
export type AccentPreset = {
  id: string;
  name: string;
  accent: string;
  accentButton: string;
};

/** Accent palette offered in Settings. `sky` matches the default theme. */
export const accentPresets: AccentPreset[] = [
  { id: "sky", name: "Sky", accent: "#60D4FC", accentButton: "#2898CB" },
  { id: "blue", name: "Blue", accent: "#0A84FF", accentButton: "#0A6CD0" },
  { id: "indigo", name: "Indigo", accent: "#7D7AFF", accentButton: "#5B57E0" },
  { id: "purple", name: "Purple", accent: "#BF5AF2", accentButton: "#9938CC" },
  { id: "pink", name: "Pink", accent: "#FF6482", accentButton: "#D64463" },
  { id: "red", name: "Red", accent: "#FF453A", accentButton: "#D2352B" },
  { id: "orange", name: "Orange", accent: "#FF9F0A", accentButton: "#D77F00" },
  { id: "green", name: "Green", accent: "#30D158", accentButton: "#249C43" },
  { id: "teal", name: "Teal", accent: "#40C8C0", accentButton: "#2A9C95" },
];

export const DEFAULT_ACCENT_ID = "sky";
