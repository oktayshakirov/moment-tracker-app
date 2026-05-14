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
import { radii, space, typography, type Theme } from "@/shared/theme/tokens";
import type { Moment } from "../domain/moment";
import {
  formatDurationRows,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "../domain/momentFormatters";
import { cancelMilestoneNotifications } from "../data/milestoneNotifications";
import { MomentBackground } from "./MomentBackground";

function detailChromeBottomInset(topInset: number): number {
  return topInset + space.xs + 44 + space.sm;
}

export function MomentDetailScreen({
  navigation,
  route,
}: MomentDetailScreenProps) {
  const { momentId } = route.params;
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const chromeBottom = detailChromeBottomInset(insets.top);
  const { moments } = useRepositories();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [now, setNow] = useState(() => new Date());
  const shotRef = useRef<View>(null);
  const momentRef = useRef<Moment | null>(null);
  const nowRef = useRef(now);

  momentRef.current = moment;
  nowRef.current = now;

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

  const shareImage = useCallback(async () => {
    const m = momentRef.current;
    if (!m) return;
    const n = nowRef.current;
    const rowLines = formatDurationRows(m, n);
    const su = formatSinceUntilLabel(m, n);
    const ed = format(new Date(m.targetDateTime), "MMMM d, yyyy • h:mm a");
    const unsplashAttr =
      m.backgroundValue.kind === "image"
        ? m.backgroundValue.unsplashAttribution
        : undefined;
    const lines = [
      ...rowLines.map((r) => `${r.value} ${r.unit}`),
      su,
      ed,
    ];
    if (unsplashAttr) {
      lines.push(
        `Photo by ${unsplashAttr.photographerName} on Unsplash — ${unsplashAttr.photoHtmlUrl}`,
      );
    }
    const body = lines.join("\n");
    const fallbackText = `${m.title}\n${body}`;
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
          dialogTitle: m.title,
        });
      } else {
        await Share.share({ url: uri });
      }
    } catch {
      await Share.share({ message: fallbackText });
    }
  }, []);

  const onDelete = useCallback(() => {
    const m = momentRef.current;
    if (!m) return;
    Alert.alert("Delete moment?", `"${m.title}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          void (async () => {
            await cancelMilestoneNotifications(m.id);
            await moments.delete(m.id);
            navigation.goBack();
          })(),
      },
    ]);
  }, [moments, navigation]);

  if (!moment) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary }}>Loading…</Text>
        </View>
        <DetailChromeBar
          theme={theme}
          topInset={insets.top}
          onBack={() => navigation.goBack()}
          showActions={false}
          onShare={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </View>
    );
  }

  const unsplashAttr =
    moment.backgroundValue.kind === "image"
      ? moment.backgroundValue.unsplashAttribution
      : undefined;

  return (
    <View style={styles.root}>
      <View ref={shotRef} style={styles.capture} collapsable={false}>
        <MomentBackground moment={moment} />
        <View style={styles.scrim} />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: chromeBottom + 12 },
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
                  <Animated.Text
                    entering={FadeInDown.delay(80)}
                    style={styles.rowValue}
                  >
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
      <DetailChromeBar
        theme={theme}
        topInset={insets.top}
        onBack={() => navigation.goBack()}
        showActions
        onShare={() => void shareImage()}
        onEdit={() =>
          navigation.navigate("MomentForm", { momentId: moment.id })
        }
        onDelete={onDelete}
      />
    </View>
  );
}

type IconPillProps = {
  theme: Theme;
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
};

function IconPill({
  theme,
  name,
  onPress,
  accessibilityLabel,
  color,
}: IconPillProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.chromePill,
        styles.chromeIconPill,
        {
          backgroundColor: theme.glassFill,
          borderColor: theme.glassBorder,
        },
        pressed && styles.chromePillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={name} size={22} color={color ?? theme.text} />
    </Pressable>
  );
}

type DetailChromeBarProps = {
  theme: Theme;
  topInset: number;
  onBack: () => void;
  showActions: boolean;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DetailChromeBar({
  theme,
  topInset,
  onBack,
  showActions,
  onShare,
  onEdit,
  onDelete,
}: DetailChromeBarProps) {
  const pill = [
    styles.chromePill,
    {
      backgroundColor: theme.glassFill,
      borderColor: theme.glassBorder,
    },
  ];

  return (
    <View style={styles.chromeOverlay} pointerEvents="box-none">
      <View style={[styles.chromeBar, { paddingTop: topInset + space.xs }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [
            ...pill,
            styles.chromeBackPill,
            pressed && styles.chromePillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to Moments"
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
          <Text style={[styles.chromeBackLabel, { color: theme.text }]}>
            Moments
          </Text>
        </Pressable>

        {showActions ? (
          <View style={styles.chromeActions}>
            <IconPill
              theme={theme}
              name="share-outline"
              onPress={onShare}
              accessibilityLabel="Share"
            />
            <IconPill
              theme={theme}
              name="create-outline"
              onPress={onEdit}
              accessibilityLabel="Edit moment"
            />
            <IconPill
              theme={theme}
              name="trash-outline"
              onPress={onDelete}
              accessibilityLabel="Delete moment"
              color={theme.danger}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chromeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    zIndex: 20,
  },
  chromeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    gap: space.md,
  },
  chromePill: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  chromePillPressed: {
    opacity: 0.82,
  },
  chromeBackPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    paddingVertical: space.sm,
    paddingLeft: space.xs,
    paddingRight: space.md,
    gap: 2,
    maxWidth: "48%",
  },
  chromeBackLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  chromeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexShrink: 0,
  },
  chromeIconPill: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
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
  },
  heroBlock: {
    gap: 8,
    paddingTop: 16,
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
