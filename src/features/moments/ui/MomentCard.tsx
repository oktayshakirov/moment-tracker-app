import React, { useEffect, useState } from "react";
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
import {
  formatMomentPrimaryDisplay,
  formatMomentUnitLabel,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "../domain/momentFormatters";
import { MomentBackground } from "./MomentBackground";

type Props = {
  moment: Moment;
  onPress: () => void;
};

export function MomentCard({ moment, onPress }: Props) {
  const [now, setNow] = useState(() => new Date());
  const scale = useSharedValue(1);

  useEffect(() => {
    const ms = getTickerIntervalMs(moment.displayUnit, moment);
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [moment]);

  const primary = formatMomentPrimaryDisplay(moment, now, "compact");
  const unitLabel = formatMomentUnitLabel(moment);
  const sinceUntil = formatSinceUntilLabel(moment, now);
  const isAuto = moment.displayUnit === "auto";

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        style={styles.press}
      >
        <GlassCard style={styles.card}>
          <View style={styles.clip}>
            <MomentBackground moment={moment} />
            <LinearDarkOverlay />
            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text
                  style={[styles.title, { color: "#fff" }]}
                  numberOfLines={2}
                >
                  {moment.title}
                </Text>
                <View style={styles.durationBlock}>
                  {isAuto ? (
                    <AnimatedCounterText
                      value={primary}
                      animate={false}
                      compound
                    />
                  ) : (
                    <View style={styles.counterRow}>
                      <AnimatedCounterText
                        value={primary}
                        animate
                        compound={false}
                      />
                      <Text
                        style={[
                          styles.unit,
                          { color: "rgba(255,255,255,0.85)" },
                        ]}
                      >
                        {unitLabel}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.sinceUntil}>{sinceUntil}</Text>
                </View>
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

function LinearDarkOverlay() {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]}
    />
  );
}

function AnimatedCounterText({
  value,
  animate,
  compound,
}: {
  value: string;
  animate: boolean;
  compound: boolean;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;
    pulse.value = withSpring(1.04, { damping: 14, stiffness: 220 }, () => {
      pulse.value = withSpring(1);
    });
  }, [value, pulse, animate]);

  const anim = useAnimatedStyle(() => ({
    transform: animate ? [{ scale: pulse.value }] : [{ scale: 1 }],
  }));

  return (
    <Animated.Text
      style={[
        compound ? styles.durationCompound : styles.counter,
        { color: "#fff" },
        anim,
      ]}
      numberOfLines={compound ? 3 : 1}
    >
      {value}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  press: {
    marginBottom: space.md,
  },
  card: {
    minHeight: 112,
  },
  clip: {
    borderRadius: radii.lg,
    overflow: "hidden",
    minHeight: 112,
    justifyContent: "flex-end",
  },
  row: {
    alignItems: "flex-end",
    padding: space.lg,
  },
  textCol: {
    gap: 4,
  },
  title: {
    fontSize: typography.title2,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  durationBlock: {
    alignItems: "flex-end",
    gap: 6,
    marginTop: 4,
    width: "100%",
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  counter: {
    fontSize: 26,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  durationCompound: {
    fontSize: typography.body,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 22,
    textAlign: "right",
  },
  unit: {
    fontSize: typography.caption,
    fontWeight: "500",
  },
});
