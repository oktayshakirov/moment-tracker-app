import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HomeScreenProps } from "@/app/navigation/types";
import { Screen } from "@/shared/ui/Screen";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { useRepositories } from "@/app/database/AppDataProvider";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography, type Theme } from "@/shared/theme/tokens";
import type { Category } from "@/features/categories/domain/category";
import type { Moment } from "../domain/moment";
import { Swipeable } from "react-native-gesture-handler";
import { syncAllWidgets } from "@/widgets/syncWidgets";
import { cancelMomentReminder } from "@/features/reminders/reminderScheduler";
import { SwipeableMomentRow } from "./SwipeableMomentRow";
import { MomentGridItem } from "./MomentGridItem";

type Section = {
  category: Category | null;
  data: Moment[];
};

type SortOrder = "alpha" | "date-asc" | "date-desc";
type CategorySortOrder = "date-asc" | "date-desc" | "alpha";
type ViewMode = "big" | "small" | "list" | "grid";

export function MomentListScreen({ navigation }: HomeScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { categories, moments } = useRepositories();
  const [sections, setSections] = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("alpha");
  const [categorySortOrder, setCategorySortOrder] = useState<CategorySortOrder>("date-asc");
  const [showSortModal, setShowSortModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("big");
  const prefsLoaded = useRef(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const activeSwipeRef = useRef<InstanceType<typeof Swipeable> | null>(null);

  const load = useCallback(async () => {
    try {
      const cats = await categories.listAll();
      const all = await moments.listAll();
      const byCat = new Map<string | null, Moment[]>();
      for (const m of all) {
        const list = byCat.get(m.categoryId) ?? [];
        list.push(m);
        byCat.set(m.categoryId, list);
      }
      const next: Section[] = [];
      for (const c of cats) {
        const data = byCat.get(c.id) ?? [];
        if (data.length > 0) {
          next.push({ category: c, data });
        }
      }
      const uncategorized = byCat.get(null) ?? [];
      if (uncategorized.length > 0) {
        next.push({ category: null, data: uncategorized });
      }
      setSections(next);
    } finally {
      setInitialLoading(false);
    }
  }, [categories, moments]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    AsyncStorage.multiGet(["sortOrder", "categorySortOrder", "viewMode"]).then(([[, so], [, cso], [, vm]]) => {
      if (so) setSortOrder(so as SortOrder);
      if (cso) setCategorySortOrder(cso as CategorySortOrder);
      if (vm) setViewMode(vm as ViewMode);
      prefsLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    void AsyncStorage.setItem("sortOrder", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    void AsyncStorage.setItem("categorySortOrder", categorySortOrder);
  }, [categorySortOrder]);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    void AsyncStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const displaySections = useMemo(() => {
    const sortFn = (a: Moment, b: Moment): number => {
      switch (sortOrder) {
        case "alpha":
          return a.title.localeCompare(b.title);
        case "date-asc":
          return new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime();
        case "date-desc":
          return new Date(b.targetDateTime).getTime() - new Date(a.targetDateTime).getTime();
      }
    };
    const sorted = sections.map((s) => ({ ...s, data: [...s.data].sort(sortFn) }));
    // Always keep General (null category) last
    const named = sorted.filter((s) => s.category !== null);
    const general = sorted.filter((s) => s.category === null);
    if (categorySortOrder === "alpha") {
      named.sort((a, b) => a.category!.title.localeCompare(b.category!.title));
    } else if (categorySortOrder === "date-desc") {
      named.reverse();
    }
    // "date-asc" keeps original insertion order (default from DB)
    return [...named, ...general];
  }, [sections, sortOrder, categorySortOrder]);

  // Grid view packs each section's moments into rows of two.
  const renderSections = useMemo(() => {
    if (viewMode !== "grid") return displaySections;
    return displaySections.map((s) => {
      const rows: Moment[][] = [];
      for (let i = 0; i < s.data.length; i += 2) {
        rows.push(s.data.slice(i, i + 2));
      }
      return { ...s, data: rows as unknown as Moment[] };
    });
  }, [displaySections, viewMode]);

  const totalMoments = useMemo(
    () => sections.reduce((acc, s) => acc + s.data.length, 0),
    [sections],
  );
  const hasCategories = useMemo(
    () => sections.some((s) => s.category !== null),
    [sections],
  );

  const header = (
    <HomeListChrome
      theme={theme}
      topInset={insets.top}
      onOpenSort={() => setShowSortModal(true)}
      onOpenView={() => setShowViewModal(true)}
      navigation={navigation}
    />
  );

  if (initialLoading) {
    return (
      <Screen edges={["left", "right"]}>
        <View style={styles.shell}>
          {header}
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["left", "right"]}>
      <View style={styles.shell}>
        {header}
        <SectionList
          sections={renderSections}
          keyExtractor={(item) =>
            Array.isArray(item) ? item.map((m) => m.id).join("-") : item.id
          }
          contentContainerStyle={[
            styles.listContent,
            totalMoments === 0 && styles.emptyGrow,
          ]}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: section.category
                      ? section.category.colorHex
                      : theme.textTertiary,
                  },
                ]}
              />
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                {section.category ? section.category.title : "General"}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            if (Array.isArray(item)) {
              return (
                <View style={styles.gridRow}>
                  {item.map((m) => (
                    <MomentGridItem
                      key={m.id}
                      moment={m}
                      onPress={() =>
                        navigation.navigate("MomentDetail", { momentId: m.id })
                      }
                    />
                  ))}
                  {item.length === 1 && <View style={styles.gridSpacer} />}
                </View>
              );
            }
            return (
              <SwipeableMomentRow
                activeSwipeRef={activeSwipeRef}
                moment={item}
                variant={viewMode === "grid" ? "big" : viewMode}
                onPress={() =>
                  navigation.navigate("MomentDetail", { momentId: item.id })
                }
                onDelete={() =>
                  void (async () => {
                    await cancelMomentReminder(item.id);
                    await moments.delete(item.id);
                    await syncAllWidgets(moments);
                    await load();
                  })()
                }
                onResetStart={() =>
                  void moments.resetStartTime(item.id).then(async () => {
                    await syncAllWidgets(moments);
                    await load();
                  })
                }
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Start tracking time
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Create your first moment and count the days that matter.
              </Text>
              <PrimaryButton
                label="Create a moment"
                onPress={() => navigation.navigate("MomentForm", {})}
                style={styles.emptyCta}
              />
            </View>
          }
        />
      </View>

      <Modal visible={showSortModal} animationType="fade" transparent>
        <Pressable
          style={[styles.sortBackdrop, { backgroundColor: theme.overlay }]}
          onPress={() => setShowSortModal(false)}
        >
          <Pressable
            style={[styles.sortSheet, { backgroundColor: theme.bgElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.sortHeader}>
              <Text style={[styles.sortTitle, { color: theme.text }]}>
                Sorting Options
              </Text>
              <Pressable
                onPress={() => setShowSortModal(false)}
                hitSlop={8}
                style={[styles.sortCloseBtn, { backgroundColor: theme.glassFill, borderColor: theme.glassBorder }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Moments section */}
            <Text style={[styles.sortSectionLabel, { color: theme.textSecondary }]}>
              MOMENTS
            </Text>
            {(
              [
                { value: "alpha", label: "Alphabetically", icon: "text-outline" },
                { value: "date-asc", label: "Date Ascending", icon: "arrow-up-outline" },
                { value: "date-desc", label: "Date Descending", icon: "arrow-down-outline" },
              ] as { value: SortOrder; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[]
            ).map((opt) => {
              const active = sortOrder === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.sortOption,
                    { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
                    active && { borderColor: theme.accent, backgroundColor: theme.accent + "22" },
                  ]}
                  onPress={() => setSortOrder(opt.value)}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? theme.accent : theme.textSecondary} />
                  <Text style={[styles.sortOptionLabel, { color: active ? theme.accent : theme.text }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={16} color={theme.accent} style={styles.sortCheckmark} />
                  )}
                </Pressable>
              );
            })}

            {/* Categories section — only when categories exist */}
            {hasCategories && (
              <>
                <View style={[styles.sortDivider, { backgroundColor: theme.glassBorder }]} />
                <Text style={[styles.sortSectionLabel, { color: theme.textSecondary }]}>
                  CATEGORIES
                </Text>
                {(
                  [
                    { value: "date-asc", label: "Date Ascending", icon: "arrow-up-outline" },
                    { value: "date-desc", label: "Date Descending", icon: "arrow-down-outline" },
                    { value: "alpha", label: "Alphabetically", icon: "text-outline" },
                  ] as { value: CategorySortOrder; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[]
                ).map((opt) => {
                  const active = categorySortOrder === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.sortOption,
                        { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
                        active && { borderColor: theme.accent, backgroundColor: theme.accent + "22" },
                      ]}
                      onPress={() => setCategorySortOrder(opt.value)}
                    >
                      <Ionicons name={opt.icon} size={18} color={active ? theme.accent : theme.textSecondary} />
                      <Text style={[styles.sortOptionLabel, { color: active ? theme.accent : theme.text }]}>
                        {opt.label}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark" size={16} color={theme.accent} style={styles.sortCheckmark} />
                      )}
                    </Pressable>
                  );
                })}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showViewModal} animationType="fade" transparent>
        <Pressable
          style={[styles.sortBackdrop, { backgroundColor: theme.overlay }]}
          onPress={() => setShowViewModal(false)}
        >
          <Pressable
            style={[styles.sortSheet, { backgroundColor: theme.bgElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sortHeader}>
              <Text style={[styles.sortTitle, { color: theme.text }]}>
                View Options
              </Text>
              <Pressable
                onPress={() => setShowViewModal(false)}
                hitSlop={8}
                style={[styles.sortCloseBtn, { backgroundColor: theme.glassFill, borderColor: theme.glassBorder }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {(
              [
                { value: "big", label: "Big Card", icon: "square-outline" },
                { value: "small", label: "Small Card", icon: "tablet-portrait-outline" },
                { value: "list", label: "List", icon: "list-outline" },
                { value: "grid", label: "Grid", icon: "grid-outline" },
              ] as { value: ViewMode; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[]
            ).map((opt) => {
              const active = viewMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.sortOption,
                    { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
                    active && { borderColor: theme.accent, backgroundColor: theme.accent + "22" },
                  ]}
                  onPress={() => {
                    setViewMode(opt.value);
                    setShowViewModal(false);
                  }}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? theme.accent : theme.textSecondary} />
                  <Text style={[styles.sortOptionLabel, { color: active ? theme.accent : theme.text }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={16} color={theme.accent} style={styles.sortCheckmark} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

type HomeListChromeProps = {
  theme: Theme;
  topInset: number;
  onOpenSort: () => void;
  onOpenView: () => void;
  navigation: HomeScreenProps["navigation"];
};

function HomeListChrome({ theme, topInset, onOpenSort, onOpenView, navigation }: HomeListChromeProps) {
  return (
    <View style={[styles.chromeBar, { paddingTop: topInset + space.xs, backgroundColor: theme.bg }]}>
      <Text
        style={[styles.chromeScreenTitle, { color: theme.text }]}
        numberOfLines={1}
      >
        Moments
      </Text>
      <Pressable
        onPress={onOpenView}
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
        accessibilityLabel="View options"
      >
        <Ionicons name="grid-outline" size={19} color={theme.textSecondary} />
      </Pressable>
      <Pressable
        onPress={onOpenSort}
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
        accessibilityLabel="Sort moments"
      >
        <Ionicons name="swap-vertical-outline" size={20} color={theme.textSecondary} />
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("MomentForm", {})}
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
        accessibilityLabel="Add moment"
      >
        <Ionicons name="add" size={22} color={theme.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  chromeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    gap: space.md,
  },
  chromeScreenTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  chromePill: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  chromePillPressed: {
    opacity: 0.82,
  },
  chromeIconPill: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  emptyGrow: {
    flexGrow: 1,
    justifyContent: "center",
  },
  gridRow: {
    flexDirection: "row",
    gap: space.md,
  },
  gridSpacer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: space.md,
    marginBottom: space.sm,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  empty: {
    paddingHorizontal: space.xl,
    gap: space.md,
    alignItems: "stretch",
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptySub: {
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: space.md,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sortBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: space.xl,
  },
  sortSheet: {
    borderRadius: radii.lg,
    padding: space.xl,
    gap: space.md,
  },
  sortHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortTitle: {
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
  },
  sortCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  sortSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: -space.xs,
  },
  sortDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space.xs,
  },
  sortOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sortOptionLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    flex: 1,
  },
  sortCheckmark: {
    marginLeft: "auto",
  },
});
