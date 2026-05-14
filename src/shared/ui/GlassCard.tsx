import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, shadows } from "@/shared/theme/tokens";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function GlassCard({ children, style }: Props) {
  const theme = useAppTheme();
  const tintLayer = (
    <LinearGradient
      colors={theme.glassTintGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.tintLayer}
      pointerEvents="none"
    />
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={52}
        tint="dark"
        style={[
          styles.card,
          shadows.card,
          {
            borderColor: theme.glassBorder,
            backgroundColor: theme.glassFill,
          },
          style,
        ]}
      >
        {tintLayer}
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: theme.glassFill,
          borderColor: theme.glassBorder,
        },
        style,
      ]}
    >
      {tintLayer}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
