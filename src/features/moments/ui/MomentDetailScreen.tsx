import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
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
import { format } from "date-fns";
import type { MomentDetailScreenProps } from "@/app/navigation/types";
import { useRepositories } from "@/app/database/AppDataProvider";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import type { Moment } from "../domain/moment";
import {
  formatDurationRows,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "../domain/momentFormatters";
import { cancelMilestoneNotifications } from "../data/milestoneNotifications";
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

  const rows = moment ? formatDurationRows(moment, now) : [];
  const hasSecondsRow = rows.some((r) => r.unit === "Seconds");
  const sinceUntil = moment ? formatSinceUntilLabel(moment, now) : "Since";
  const eventDateText = moment
    ? format(new Date(moment.targetDateTime), "MMMM d, yyyy • h:mm a")
    : "";

  useEffect(() => {
    if (!moment) return;
    const baseMs = getTickerIntervalMs(moment.displayUnit, moment);
    const ms = hasSecondsRow ? 1000 : baseMs;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [moment, hasSecondsRow]);

  if (!moment) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  const unsplashAttr =
    moment.backgroundValue.kind === "image"
      ? moment.backgroundValue.unsplashAttribution
      : undefined;

  const shareImage = async () => {
    const lines = [
      ...rows.map((r) => `${r.value} ${r.unit}`),
      sinceUntil,
      eventDateText,
    ];
    if (unsplashAttr) {
      lines.push(
        `Photo by ${unsplashAttr.photographerName} on Unsplash — ${unsplashAttr.photoHtmlUrl}`,
      );
    }
    const body = lines.join("\n");
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

  const onDelete = () => {
    Alert.alert(
      "Delete moment?",
      `"${moment.title}" will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void (async () => {
              await cancelMilestoneNotifications(moment.id);
              await moments.delete(moment.id);
              navigation.goBack();
            })(),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View ref={shotRef} style={styles.capture} collapsable={false}>
        <MomentBackground moment={moment} />
        <View style={[styles.scrim, { paddingTop: insets.top + 8 }]} />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            unsplashAttr && {
              paddingBottom: insets.bottom + 52,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.duration(420)}
            style={styles.heroBlock}
          >
            <Text style={styles.title}>{moment.title}</Text>
            <View style={styles.rowsCol}>
              {rows.map((r) => (
                <View key={`${r.value}-${r.unit}`} style={styles.rowStat}>
                  <Animated.Text entering={FadeInDown.delay(80)} style={styles.rowValue}>
                    {r.value}
                  </Animated.Text>
                  <Text style={styles.rowUnit}>{r.unit}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sinceUntil}>{sinceUntil}</Text>
          </Animated.View>
          <View style={styles.bottomDateWrap}>
            <Text style={styles.bottomDate}>{eventDateText}</Text>
          </View>
        </ScrollView>
        {unsplashAttr ? (
          <View
            style={[
              styles.unsplashFooter,
              { paddingBottom: Math.max(insets.bottom, 12) + 8 },
            ]}
            pointerEvents="box-none"
          >
            <Text style={styles.unsplashAttributionText}>
              Photo by{" "}
              <Text
                style={styles.unsplashAttrLink}
                onPress={() =>
                  void Linking.openURL(unsplashAttr.photographerHtmlUrl)
                }
              >
                {unsplashAttr.photographerName}
              </Text>
              {" on "}
              <Text
                style={styles.unsplashAttrLink}
                onPress={() => void Linking.openURL("https://unsplash.com")}
              >
                Unsplash
              </Text>
            </Text>
          </View>
        ) : null}
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
          <Pressable onPress={onDelete} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
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
    gap: 8,
    paddingTop: 92,
  },
  title: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: space.md,
  },
  rowsCol: {
    gap: 6,
  },
  rowStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  rowValue: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 66,
    letterSpacing: -1.4,
    fontVariant: ["tabular-nums"],
  },
  rowUnit: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.75)",
    fontSize: typography.title2,
    fontWeight: "700",
    letterSpacing: -0.1,
    textTransform: "uppercase",
    marginTop: space.md,
  },
  bottomDateWrap: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: 180,
    paddingBottom: space.xl,
  },
  bottomDate: {
    color: "rgba(255,255,255,0.92)",
    fontSize: typography.title2,
    fontWeight: "600",
  },
  unsplashFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    alignItems: "center",
    zIndex: 4,
  },
  unsplashAttributionText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.caption,
    fontWeight: "500",
    textAlign: "center",
  },
  unsplashAttrLink: {
    color: "rgba(255,255,255,0.92)",
    textDecorationLine: "underline",
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
