import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
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
import { useContentPadding, useIsTablet } from "@/shared/ui/tablet";
import type { Moment } from "../domain/moment";
import {
  formatDisplayUnit,
  formatDurationRows,
  formatSinceUntilLabel,
  getMomentDeltaMs,
  getTickerIntervalMs,
  type FixedDisplayUnit,
} from "../domain/momentFormatters";
import { unsplashHomeUrl, withUnsplashReferral } from "../data/unsplashApi";
import { syncAllWidgets } from "@/widgets/syncWidgets";
import { cancelMomentReminder } from "@/features/reminders/reminderScheduler";
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
  const isTablet = useIsTablet();
  const hPad = useContentPadding(space.md);
  const chromeHPad = useContentPadding(space.lg);
  const chromeBottom = detailChromeBottomInset(insets.top);
  const { moments } = useRepositories();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [viewIndex, setViewIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
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
    setSharing(true);
    const n = nowRef.current;
    const rowLines = formatDurationRows(m, n);
    const su = formatSinceUntilLabel(m, n);
    const ed = format(new Date(m.targetDateTime), "MMMM d, yyyy • h:mm a");
    const unsplashAttr =
      m.backgroundValue.kind === "image"
        ? m.backgroundValue.unsplashAttribution
        : undefined;
    const lines = [...rowLines.map((r) => `${r.value} ${r.unit}`), su, ed];
    if (unsplashAttr) {
      lines.push(
        `Photo by ${unsplashAttr.photographerName} on Unsplash — ${withUnsplashReferral(unsplashAttr.photoHtmlUrl)}`,
      );
    }
    const body = lines.join("\n");
    const fallbackText = `${m.title}\n${body}`;
    if (!shotRef.current) {
      setSharing(false);
      await Share.share({ message: fallbackText });
      return;
    }
    try {
      const uri = await captureRef(shotRef, {
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });
      setSharing(false);
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
      setSharing(false);
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
            await cancelMomentReminder(m.id);
            await moments.delete(m.id);
            await syncAllWidgets(moments);
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
          hPad={chromeHPad}
          isTablet={isTablet}
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
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: hPad,
              paddingTop: chromeBottom + 12,
              paddingBottom: unsplashAttr
                ? insets.bottom + 52
                : insets.bottom + space.xxl,
            },
          ]}
        >
          <Animated.View
            entering={FadeInUp.duration(420)}
            style={styles.heroBlock}
          >
            <BlurView intensity={8} tint="dark" style={styles.glassCard}>
              <View
                style={[
                  styles.glassCardInner,
                  isTablet && styles.glassCardInnerTablet,
                ]}
              >
                <Text style={[styles.title, isTablet && styles.titleTablet]}>
                  {moment.title}
                </Text>
                <Text
                  style={[styles.cardDate, isTablet && styles.cardDateTablet]}
                >
                  {eventDateText}
                </Text>

                <UnitCarousel
                  moment={moment}
                  now={now}
                  rows={rows}
                  viewIndex={viewIndex}
                  onIndexChange={setViewIndex}
                  sinceUntil={sinceUntil}
                  isTablet={isTablet}
                />
              </View>
            </BlurView>
          </Animated.View>
        </View>
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
                  void Linking.openURL(
                    withUnsplashReferral(unsplashAttr.photographerHtmlUrl),
                  )
                }
              >
                {unsplashAttr.photographerName}
              </Text>
              {" on "}
              <Text
                style={styles.unsplashAttrLink}
                onPress={() => void Linking.openURL(unsplashHomeUrl())}
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
        hPad={chromeHPad}
        isTablet={isTablet}
        onBack={() => navigation.goBack()}
        showActions
        sharing={sharing}
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
  isTablet?: boolean;
};

function IconPill({
  theme,
  name,
  onPress,
  accessibilityLabel,
  color,
  isTablet,
}: IconPillProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.chromePill,
        styles.chromeIconPill,
        isTablet && styles.chromeIconPillTablet,
        {
          backgroundColor: theme.glassFill,
          borderColor: theme.glassBorder,
        },
        pressed && styles.chromePillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={name} size={isTablet ? 26 : 22} color={color ?? theme.text} />
    </Pressable>
  );
}

type DetailChromeBarProps = {
  theme: Theme;
  topInset: number;
  hPad: number;
  isTablet: boolean;
  onBack: () => void;
  showActions: boolean;
  sharing?: boolean;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DetailChromeBar({
  theme,
  topInset,
  hPad,
  isTablet,
  onBack,
  showActions,
  sharing = false,
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
  const iconPillStyle = [
    styles.chromeIconPill,
    isTablet && styles.chromeIconPillTablet,
  ];
  const iconSize = isTablet ? 26 : 22;

  return (
    <View style={styles.chromeOverlay} pointerEvents="box-none">
      <View style={[styles.chromeBar, { paddingTop: topInset + space.xs, paddingHorizontal: hPad }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [
            ...pill,
            styles.chromeBackPill,
            isTablet && styles.chromeBackPillTablet,
            pressed && styles.chromePillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to Moments"
        >
          <Ionicons name="chevron-back" size={iconSize} color={theme.text} />
          <Text
            style={[
              styles.chromeBackLabel,
              isTablet && styles.chromeBackLabelTablet,
              { color: theme.text },
            ]}
          >
            Moments
          </Text>
        </Pressable>

        {showActions ? (
          <View style={styles.chromeActions}>
            <Pressable
              onPress={sharing ? undefined : onShare}
              hitSlop={8}
              style={[
                styles.chromePill,
                ...iconPillStyle,
                {
                  backgroundColor: theme.glassFill,
                  borderColor: theme.glassBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              {sharing ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <Ionicons name="share-outline" size={iconSize} color={theme.text} />
              )}
            </Pressable>
            <IconPill
              theme={theme}
              name="create-outline"
              onPress={onEdit}
              accessibilityLabel="Edit moment"
              isTablet={isTablet}
            />
            <IconPill
              theme={theme}
              name="trash-outline"
              onPress={onDelete}
              accessibilityLabel="Delete moment"
              color={theme.danger}
              isTablet={isTablet}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const BREAKDOWN_UNITS: { unit: FixedDisplayUnit; label: string }[] = [
  { unit: "years", label: "Years" },
  { unit: "months", label: "Months" },
  { unit: "weeks", label: "Weeks" },
  { unit: "days", label: "Days" },
  { unit: "hours", label: "Hours" },
  { unit: "minutes", label: "Minutes" },
];

type CarouselView =
  | { kind: "compound" }
  | { kind: "unit"; unit: FixedDisplayUnit; label: string };

function UnitCarousel({
  moment,
  now,
  rows,
  viewIndex,
  onIndexChange,
  sinceUntil,
  isTablet,
}: {
  moment: Moment;
  now: Date;
  rows: { value: string; unit: string }[];
  viewIndex: number;
  onIndexChange: (i: number) => void;
  sinceUntil: string;
  isTablet: boolean;
}) {
  const valueStyle = [styles.rowValue, isTablet && styles.rowValueTablet];
  const unitStyle = [styles.rowUnit, isTablet && styles.rowUnitTablet];
  const deltaMs = getMomentDeltaMs(moment, now);
  const [compoundHeight, setCompoundHeight] = useState<number | null>(null);

  const views: CarouselView[] = [
    { kind: "compound" },
    ...BREAKDOWN_UNITS.filter(
      ({ unit }) => formatDisplayUnit(deltaMs, unit) !== "0",
    ).map((u) => ({ kind: "unit" as const, ...u })),
  ];

  const safeIndex = Math.min(viewIndex, views.length - 1);
  const current = views[safeIndex];
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < views.length - 1;
  const label = current.kind === "compound" ? "Breakdown" : current.label;

  return (
    <View>
      <Animated.View
        key={safeIndex}
        entering={FadeInDown.duration(260)}
        style={[
          ucStyles.content,
          compoundHeight !== null && { minHeight: compoundHeight },
          current.kind === "unit" && ucStyles.contentCentered,
        ]}
      >
        {current.kind === "compound" ? (
          <View
            style={styles.rowsCol}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0 && compoundHeight === null) setCompoundHeight(h);
            }}
          >
            {rows.map((r) => (
              <View key={`${r.value}-${r.unit}`} style={styles.rowStat}>
                <Text style={valueStyle}>{r.value}</Text>
                <Text style={unitStyle}>{r.unit}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={ucStyles.singleUnit}>
            <Text style={valueStyle} numberOfLines={1} adjustsFontSizeToFit>
              {formatDisplayUnit(deltaMs, current.unit)}
            </Text>
            <Text style={unitStyle}>{current.label}</Text>
          </View>
        )}
      </Animated.View>

      <Text style={[styles.sinceUntil, isTablet && styles.sinceUntilTablet]}>
        {sinceUntil}
      </Text>

      <View style={ucStyles.nav}>
        <Pressable
          onPress={() => onIndexChange(safeIndex - 1)}
          disabled={!canPrev}
          hitSlop={12}
          style={[ucStyles.arrow, !canPrev && ucStyles.arrowDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous format"
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={canPrev ? "#fff" : "rgba(255,255,255,0.25)"}
          />
        </Pressable>

        <Text style={ucStyles.navLabel}>{label}</Text>

        <Pressable
          onPress={() => onIndexChange(safeIndex + 1)}
          disabled={!canNext}
          hitSlop={12}
          style={[ucStyles.arrow, !canNext && ucStyles.arrowDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Next format"
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canNext ? "#fff" : "rgba(255,255,255,0.25)"}
          />
        </Pressable>
      </View>
    </View>
  );
}

const ucStyles = StyleSheet.create({
  content: {
    justifyContent: "flex-start",
  },
  contentCentered: {
    justifyContent: "center",
  },
  singleUnit: {
    gap: 4,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.lg,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  navLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: typography.caption,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "center",
  },
});

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
  content: {
    flex: 1,
    paddingHorizontal: space.md,
  },
  heroBlock: {
    gap: 8,
  },
  glassCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  glassCardInner: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  title: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: space.xs,
  },
  cardDate: {
    color: "rgba(255,255,255,0.55)",
    fontSize: typography.caption,
    fontWeight: "500",
    letterSpacing: 0.1,
    marginBottom: space.lg,
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
    fontSize: 51,
    fontWeight: "800",
    lineHeight: 53,
    letterSpacing: -1.4,
    fontVariant: ["tabular-nums"],
  },
  rowUnit: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  sinceUntil: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    textTransform: "uppercase",
    marginTop: space.md,
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
  // ── Tablet scaling (phones keep the base sizes above) ──
  chromeIconPillTablet: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
  },
  chromeBackPillTablet: {
    paddingVertical: space.md,
    paddingRight: space.lg,
    maxWidth: "60%",
  },
  chromeBackLabelTablet: {
    fontSize: 20,
  },
  glassCardInnerTablet: {
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
  },
  titleTablet: {
    fontSize: 46,
    letterSpacing: -1,
  },
  cardDateTablet: {
    fontSize: 17,
  },
  rowValueTablet: {
    fontSize: 70,
    lineHeight: 74,
  },
  rowUnitTablet: {
    fontSize: 46,
  },
  sinceUntilTablet: {
    fontSize: 18,
  },
});
