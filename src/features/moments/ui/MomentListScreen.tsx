import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { cancelMilestoneNotifications } from "../data/milestoneNotifications";
import { Swipeable } from "react-native-gesture-handler";
import { SwipeableMomentRow } from "./SwipeableMomentRow";

type Section = {
  category: Category;
  data: Moment[];
};

/** Matches `MomentDetailScreen` chrome row height for scroll padding. */
function screenChromeBottomInset(topInset: number): number {
  return topInset + space.xs + 44 + space.sm;
}

export function MomentListScreen({ navigation }: HomeScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const chromeBottom = screenChromeBottomInset(insets.top);
  const { categories, moments } = useRepositories();
  const [sections, setSections] = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const totalMoments = useMemo(
    () => sections.reduce((acc, s) => acc + s.data.length, 0),
    [sections],
  );

  const chrome = (
    <HomeListChrome
      theme={theme}
      topInset={insets.top}
      navigation={navigation}
    />
  );

  if (initialLoading) {
    return (
      <Screen edges={["left", "right"]}>
        <View style={styles.shell}>
          <View style={[styles.loading, { paddingTop: chromeBottom + 12 }]}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
          {chrome}
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["left", "right"]}>
      <View style={styles.shell}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: chromeBottom + 12 },
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
                  { backgroundColor: section.category.colorHex },
                ]}
              />
              <Text
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                {section.category.title}
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
                  await cancelMilestoneNotifications(item.id);
                  await moments.delete(item.id);
                  await load();
                })()
              }
              onResetStart={() =>
                void moments.resetStartTime(item.id).then(load)
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
        {chrome}
      </View>
    </Screen>
  );
}

type HomeListChromeProps = {
  theme: Theme;
  topInset: number;
  navigation: HomeScreenProps["navigation"];
};

function HomeListChrome({ theme, topInset, navigation }: HomeListChromeProps) {
  return (
    <View style={styles.chromeOverlay} pointerEvents="box-none">
      <View style={[styles.chromeBar, { paddingTop: topInset + space.xs }]}>
        <Text
          style={[styles.chromeScreenTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          Moments
        </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
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
});
