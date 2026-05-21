import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { MomentRepository } from "@/features/moments/data/momentRepository";
import type { Moment } from "@/features/moments/domain/moment";
import { MomentCard } from "@/features/moments/ui/MomentCard";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { space, typography } from "@/shared/theme/tokens";

type Props = {
  moments: MomentRepository;
  onSelect: (momentId: string) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
};

export function WidgetMomentPickerContent({
  moments,
  onSelect,
  onCancel,
  title = "Choose a moment",
  subtitle,
}: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await moments.listAll());
    } finally {
      setLoading(false);
    }
  }, [moments]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + space.sm, borderBottomColor: theme.separator },
        ]}
      >
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: theme.textSecondary, paddingBottom: space.sm },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No moments yet
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Create a moment in the app first, then add it to your widget.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: space.md,
            paddingBottom: insets.bottom + space.lg,
          }}
          renderItem={({ item }) => (
            <MomentCard
              moment={item}
              onPress={() => void onSelect(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.title2,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: typography.caption,
    textAlign: "center",
    paddingHorizontal: space.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.sm,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    fontSize: typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
});
