import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/shared/theme/ThemeContext";
import { radii, space, typography } from "@/shared/theme/tokens";
import { isProCached } from "@/app/pro/proCache";
import { FREE_WIDGET_LIMIT } from "@/constants/limits";
import { countWidgetBindings, getWidgetMomentId } from "./widgetBindingStore";

type SlotState = "loading" | "allowed" | "locked";

/**
 * Decide whether a free user may bind this widget. Re-configuring a widget that
 * is already bound is always allowed; only adding a *new* widget beyond
 * {@link FREE_WIDGET_LIMIT} is gated.
 */
function useWidgetSlot(widgetId: number): SlotState {
  const [state, setState] = useState<SlotState>("loading");
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pro = await isProCached();
      if (pro) return cancelled || setState("allowed");
      const alreadyBound = await getWidgetMomentId(widgetId);
      if (alreadyBound) return cancelled || setState("allowed");
      const count = await countWidgetBindings();
      if (!cancelled) {
        setState(count >= FREE_WIDGET_LIMIT ? "locked" : "allowed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [widgetId]);
  return state;
}

/**
 * Wraps the widget moment picker. Free users who already use their one allowed
 * widget see an upgrade notice instead of the picker.
 */
export function WidgetSlotGate({
  widgetId,
  onCancel,
  children,
}: {
  widgetId: number;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const state = useWidgetSlot(widgetId);
  const theme = useAppTheme();

  if (state === "loading") {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }
  if (state === "allowed") {
    return <>{children}</>;
  }

  return (
    <View style={[styles.shell, { backgroundColor: theme.bg }]}>
      <Ionicons name="lock-closed" size={40} color={theme.accent} />
      <Text style={[styles.title, { color: theme.text }]}>Pro feature</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The free plan includes one widget. Upgrade to Moment Tracker Pro in the
        app to add more widgets to your home screen.
      </Text>
      <Pressable
        onPress={onCancel}
        style={[styles.btn, { backgroundColor: theme.accent }]}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  btn: {
    borderRadius: radii.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    marginTop: space.sm,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
});
