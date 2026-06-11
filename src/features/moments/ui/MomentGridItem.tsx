import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GlassCard } from "@/shared/ui/GlassCard";
import { radii, space, typography } from "@/shared/theme/tokens";
import type { Moment } from "../domain/moment";
import { MomentBackground } from "./MomentBackground";
import { useMomentDisplay } from "./useMomentDisplay";

type Props = {
  moment: Moment;
  onPress: () => void;
};

export function MomentGridItem({ moment, onPress }: Props) {
  const { mainValue, subValue } = useMomentDisplay(moment);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const firstUnit = subValue ? subValue.split(" ")[0] : "";
  const counter = [mainValue, firstUnit].filter(Boolean).join(" ");

  return (
    <Animated.View entering={FadeIn.duration(280)} style={[styles.cell, animStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
      >
        <GlassCard style={styles.card}>
          <View style={styles.clip}>
            <MomentBackground moment={moment} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.35)" },
              ]}
            />
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {moment.title}
              </Text>
              <Text style={styles.counter} numberOfLines={1}>
                {counter}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    marginBottom: space.md,
  },
  card: {
    minHeight: 132,
  },
  clip: {
    borderRadius: radii.lg,
    overflow: "hidden",
    minHeight: 132,
    justifyContent: "space-between",
    padding: space.md,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: typography.body,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  counter: {
    color: "#fff",
    fontSize: typography.title,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    marginTop: space.sm,
  },
});
