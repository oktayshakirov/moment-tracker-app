import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MomentDetailScreenProps } from "@/app/navigation/types";
import { useRepositories } from "@/app/database/AppDataProvider";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import type { Moment } from "../domain/moment";
import {
  formatMomentPrimaryDisplay,
  formatMomentUnitLabel,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "../domain/momentFormatters";
import { MomentBackground } from "./MomentBackground";

export function MomentDetailScreen({
  navigation,
  route,
}: MomentDetailScreenProps) {
  const { momentId } = route.params;
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { moments } = useRepositories();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [now, setNow] = useState(() => new Date());
  const shotRef = useRef<View>(null);

  const load = useCallback(async () => {
    const m = await moments.getById(momentId);
    setMoment(m);
  }, [momentId, moments]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!moment) return;
    const ms = getTickerIntervalMs(moment.displayUnit, moment);
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [moment]);

  if (!moment) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  const primary = formatMomentPrimaryDisplay(moment, now, "full");
  const unit = formatMomentUnitLabel(moment);
  const sinceUntil = formatSinceUntilLabel(moment, now);

  const shareImage = async () => {
    const body = unit
      ? `${sinceUntil}\n${primary}\n${unit}`
      : `${sinceUntil}\n${primary}`;
    const fallbackText = `${moment.title}\n${body}`;
    if (!shotRef.current) {
      await Share.share({ message: fallbackText });
      return;
    }
    try {
      const uri = await captureRef(shotRef, {
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: moment.title,
        });
      } else {
        await Share.share({ url: uri });
      }
    } catch {
      await Share.share({ message: fallbackText });
    }
  };

  return (
    <View style={styles.root}>
      <View ref={shotRef} style={styles.capture} collapsable={false}>
        <MomentBackground moment={moment} />
        <View style={[styles.scrim, { paddingTop: insets.top + 8 }]} />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.duration(420)}
            style={styles.heroBlock}
          >
            <Text style={styles.title}>{moment.title}</Text>
            <Text style={styles.sinceUntil}>{sinceUntil}</Text>
            <Animated.Text
              entering={FadeInDown.delay(80)}
              style={
                moment.displayUnit === "auto"
                  ? styles.heroCompound
                  : styles.heroNumber
              }
            >
              {primary}
            </Animated.Text>
            {unit ? <Text style={styles.heroUnit}>{unit}</Text> : null}
          </Animated.View>
        </ScrollView>
      </View>

      <View style={[styles.toolbar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.iconBtn}
          accessibilityLabel="Close"
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.toolbarRight}>
          <Pressable
            onPress={() => void shareImage()}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.navigate("MomentForm", { momentId: moment.id })
            }
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  capture: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    paddingTop: 72,
  },
  heroBlock: {
    gap: 6,
    paddingTop: 100,
  },
  title: {
    color: "#fff",
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.75)",
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  heroNumber: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
    marginTop: space.md,
  },
  heroCompound: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 36,
    marginTop: space.md,
  },
  heroUnit: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typography.title2,
    fontWeight: "600",
  },
  toolbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.md,
  },
  toolbarRight: {
    flexDirection: "row",
    gap: space.md,
  },
  iconBtn: {
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
