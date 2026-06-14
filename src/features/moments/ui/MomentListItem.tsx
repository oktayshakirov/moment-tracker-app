import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import type { Moment } from "../domain/moment";
import { useMomentDisplay } from "./useMomentDisplay";
import { momentColor } from "./momentColor";

type Props = {
  moment: Moment;
  onPress: () => void;
};

export function MomentListItem({ moment, onPress }: Props) {
  const theme = useAppTheme();
  const { mainValue, subValue, sinceUntil } = useMomentDisplay(moment);
  const color = momentColor(moment);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const firstUnit = subValue ? subValue.split(" ")[0] : "";
  const counter = [mainValue, firstUnit].filter(Boolean).join(" ");

  return (
    <Animated.View entering={FadeIn.duration(280)} style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={[
          styles.row,
          { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
        ]}
      >
        <View style={[styles.bar, { backgroundColor: color }]} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {moment.title}
          </Text>
          <Text style={[styles.since, { color: theme.textSecondary }]} numberOfLines={1}>
            {sinceUntil}
          </Text>
        </View>
        <Text style={[styles.counter, { color: theme.accent }]} numberOfLines={1}>
          {counter}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  bar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  since: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  counter: {
    fontSize: typography.title2,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.3,
    maxWidth: "55%",
    textAlign: "right",
  },
});
