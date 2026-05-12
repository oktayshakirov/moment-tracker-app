import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/shared/theme/ThemeContext";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

export function Screen({
  children,
  style,
  edges = ["top", "left", "right"],
}: Props) {
  const theme = useAppTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.bg }, style]}
    >
      <LinearGradient
        colors={theme.screenGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
