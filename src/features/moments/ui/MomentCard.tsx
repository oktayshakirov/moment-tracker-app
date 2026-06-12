import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
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
import { splitLeadingNumber } from "../domain/splitLeadingNumber";
import { MomentBackground } from "./MomentBackground";

export type MomentCardVariant = "big" | "small";

type Props = {
  moment: Moment;
  onPress: () => void;
  variant?: MomentCardVariant;
};

export function MomentCard({ moment, onPress, variant = "big" }: Props) {
  const [now, setNow] = useState(() => new Date());
  const scale = useSharedValue(1);
  const small = variant === "small";

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
        <GlassCard style={small ? styles.cardSmall : styles.card}>
          <View style={[styles.clip, small && styles.clipSmall]}>
            <MomentBackground moment={moment} />
            <LinearDarkOverlay />
            <ContentGlassPanel small={small}>
              <View style={styles.textCol}>
                <Text
                  style={[
                    small ? styles.titleSmall : styles.title,
                    { color: "#fff" },
                  ]}
                  numberOfLines={small ? 1 : 2}
                >
                  {moment.title}
                </Text>
                <View
                  style={[
                    styles.durationBlock,
                    small && styles.durationBlockSmall,
                  ]}
                >
                  <View style={styles.counterRow}>
                    <AnimatedCounterText
                      value={mainValue}
                      animate
                      small={small}
                    />
                    {subValue ? (
                      <Text
                        style={[
                          small
                            ? styles.durationCompoundSmall
                            : styles.durationCompound,
                          { color: "rgba(255,255,255,0.92)" },
                        ]}
                        numberOfLines={2}
                      >
                        {subValue}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={small ? styles.sinceUntilSmall : styles.sinceUntil}
                  >
                    {sinceUntil}
                  </Text>
                </View>
              </View>
            </ContentGlassPanel>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

function ContentGlassPanel({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  const panelStyle = [styles.glassPanel, small && styles.glassPanelSmall];
  const innerStyle = [
    styles.glassPanelInner,
    small && styles.glassPanelInnerSmall,
  ];
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={5} tint="dark" style={panelStyle}>
        <View style={innerStyle}>{children}</View>
      </BlurView>
    );
  }
  return (
    <View style={[...panelStyle, styles.glassPanelAndroid]}>
      <View style={innerStyle}>{children}</View>
    </View>
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
  small,
}: {
  value: string;
  animate: boolean;
  small?: boolean;
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
        small ? styles.counterSmall : styles.counter,
        { color: "#fff" },
        anim,
      ]}
      numberOfLines={1}
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
    minHeight: 160,
  },
  cardSmall: {
    minHeight: 110,
  },
  clip: {
    borderRadius: radii.lg,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "flex-end",
  },
  clipSmall: {
    minHeight: 110,
  },
  glassPanel: {
    margin: space.sm,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  glassPanelSmall: {
    margin: space.sm,
  },
  glassPanelAndroid: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  glassPanelInner: {
    padding: space.md,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  glassPanelInnerSmall: {
    padding: space.sm,
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
  titleSmall: {
    fontSize: typography.body,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  durationBlock: {
    alignItems: "flex-start",
    gap: 2,
    marginTop: 6,
    width: "100%",
  },
  durationBlockSmall: {
    marginTop: 2,
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  sinceUntilSmall: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
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
  counterSmall: {
    fontSize: 34,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  durationCompound: {
    fontSize: typography.title2,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 30,
  },
  durationCompoundSmall: {
    fontSize: typography.caption,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 18,
  },
});
