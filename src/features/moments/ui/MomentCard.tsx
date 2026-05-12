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
  const split = splitLeadingNumber(primary);
  const mainValue = split.leading || primary;
  const subValue = isAuto
    ? split.trailing
    : [split.trailing, unitLabel].filter(Boolean).join(" ");

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
                  <View style={styles.counterRow}>
                    <AnimatedCounterText value={mainValue} animate />
                    {subValue ? (
                      <Text
                        style={[
                          styles.durationCompound,
                          { color: "rgba(255,255,255,0.92)" },
                        ]}
                        numberOfLines={2}
                      >
                        {subValue}
                      </Text>
                    ) : null}
                  </View>
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
}: {
  value: string;
  animate: boolean;
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
        styles.counter,
        { color: "#fff" },
        anim,
      ]}
      numberOfLines={1}
    >
      {value}
    </Animated.Text>
  );
}

function splitLeadingNumber(value: string): { leading: string; trailing: string } {
  const m = value.trim().match(/^([−-]?\d[\d,]*)\s*(.*)$/);
  if (!m) return { leading: "", trailing: value.trim() };
  return { leading: m[1] ?? "", trailing: m[2] ?? "" };
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
    alignItems: "flex-start",
    padding: space.lg,
  },
  textCol: {
    gap: 6,
    width: "100%",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  durationBlock: {
    alignItems: "flex-start",
    gap: 2,
    marginTop: 6,
    width: "100%",
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  counter: {
    fontSize: 58,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.1,
    lineHeight: 62,
  },
  durationCompound: {
    fontSize: typography.title2,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 30,
  },
});
