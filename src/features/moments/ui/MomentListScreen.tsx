import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { SwipeableMomentRow } from "./SwipeableMomentRow";

type Section = {
  category: Category | null;
  data: Moment[];
};

type SortOrder = "alpha" | "date-asc" | "date-desc";

export function MomentListScreen({ navigation }: HomeScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { categories, moments } = useRepositories();
  const [sections, setSections] = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("alpha");
  const [showSortModal, setShowSortModal] = useState(false);
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
    return sections.map((s) => ({ ...s, data: [...s.data].sort(sortFn) }));
  }, [sections, sortOrder]);

  const totalMoments = useMemo(
    () => sections.reduce((acc, s) => acc + s.data.length, 0),
    [sections],
  );

  const header = (
    <HomeListChrome
      theme={theme}
      topInset={insets.top}
      sortOrder={sortOrder}
      onOpenSort={() => setShowSortModal(true)}
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
          sections={displaySections}
          keyExtractor={(item) => item.id}
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
          renderItem={({ item }) => (
            <SwipeableMomentRow
              activeSwipeRef={activeSwipeRef}
              moment={item}
              onPress={() =>
                navigation.navigate("MomentDetail", { momentId: item.id })
              }
              onDelete={() =>
                void (async () => {
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
          )}
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
            <Text style={[styles.sortTitle, { color: theme.text }]}>
              Sorting Options
            </Text>
            <Text style={[styles.sortSubtitle, { color: theme.textSecondary }]}>
              How would you like to sort your moments?
            </Text>
            {(
              [
                { value: "alpha", label: "Alphabetically" },
                { value: "date-asc", label: "Date Ascending" },
                { value: "date-desc", label: "Date Descending" },
              ] as { value: SortOrder; label: string }[]
            ).map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.sortOption,
                  { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
                  sortOrder === opt.value && { borderColor: theme.accent, backgroundColor: theme.accent + "22" },
                ]}
                onPress={() => {
                  setSortOrder(opt.value);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionLabel,
                    { color: sortOrder === opt.value ? theme.accent : theme.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

type HomeListChromeProps = {
  theme: Theme;
  topInset: number;
  sortOrder: SortOrder;
  onOpenSort: () => void;
  navigation: HomeScreenProps["navigation"];
};

function HomeListChrome({ theme, topInset, sortOrder, onOpenSort, navigation }: HomeListChromeProps) {
  return (
    <View style={[styles.chromeBar, { paddingTop: topInset + space.xs, backgroundColor: theme.bg }]}>
      <Text
        style={[styles.chromeScreenTitle, { color: theme.text }]}
        numberOfLines={1}
      >
        Moments
      </Text>
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
  sortTitle: {
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sortSubtitle: {
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: space.sm,
  },
  sortOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    paddingVertical: space.lg,
    alignItems: "center",
  },
  sortOptionLabel: {
    fontSize: typography.title2,
    fontWeight: "700",
  },
});
