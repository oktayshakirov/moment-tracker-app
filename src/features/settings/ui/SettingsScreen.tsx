import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SettingsScreenProps } from "@/app/navigation/types";
import { Screen } from "@/shared/ui/Screen";
import { useRepositories } from "@/app/database/AppDataProvider";
import { usePro } from "@/app/pro/ProContext";
import { useAppTheme, useThemeController } from "@/shared/theme/ThemeContext";
import { radii, space, typography, type Theme } from "@/shared/theme/tokens";
import { useContentPadding } from "@/shared/ui/tablet";
import { syncAllWidgets } from "@/widgets/syncWidgets";
import { syncAllReminders } from "@/features/reminders/reminderScheduler";
import {
  exportMoments,
  importMoments,
  type TransferFormat,
} from "@/features/moments/data/momentTransfer";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useAppTheme();
  const { accentId, presets, setAccent } = useThemeController();
  const insets = useSafeAreaInsets();
  const hPad = useContentPadding();
  const { moments, categories } = useRepositories();
  const {
    isPro,
    isTester,
    showPaywall,
    restore,
    showCustomerCenter,
    isAvailable,
    redeemTesterCode,
    clearTesterCode,
  } = usePro();
  const [busy, setBusy] = useState<null | "export-json" | "export-csv" | "import" | "restore">(
    null,
  );
  const [code, setCode] = useState("");

  const requirePro = useCallback((): boolean => {
    if (isPro) return true;
    void showPaywall();
    return false;
  }, [isPro, showPaywall]);

  const handleExport = useCallback(
    async (format: TransferFormat) => {
      if (!requirePro()) return;
      setBusy(format === "json" ? "export-json" : "export-csv");
      try {
        const all = await moments.listAll();
        if (all.length === 0) {
          Alert.alert("Nothing to export", "Create a moment first.");
          return;
        }
        const cats = await categories.listAll();
        const result = await exportMoments(all, cats, format);
        if (!result.shared) {
          Alert.alert(
            "Sharing unavailable",
            "Couldn't open the share sheet on this device.",
          );
        }
      } catch (e) {
        Alert.alert("Export failed", String(e));
      } finally {
        setBusy(null);
      }
    },
    [requirePro, moments, categories],
  );

  const handleImport = useCallback(async () => {
    if (!requirePro()) return;
    setBusy("import");
    try {
      const result = await importMoments(moments, categories);
      switch (result.status) {
        case "ok":
          await syncAllWidgets(moments);
          await syncAllReminders(moments);
          Alert.alert(
            "Import complete",
            `${result.imported} moment${result.imported === 1 ? "" : "s"} imported.`,
          );
          break;
        case "empty":
          Alert.alert("Nothing imported", "No moments were found in that file.");
          break;
        case "error":
          Alert.alert("Import failed", result.message);
          break;
        case "cancelled":
          break;
      }
    } catch (e) {
      Alert.alert("Import failed", String(e));
    } finally {
      setBusy(null);
    }
  }, [requirePro, moments, categories]);

  const handleRedeem = useCallback(async () => {
    const ok = await redeemTesterCode(code);
    if (ok) {
      setCode("");
      Alert.alert("Pro unlocked", "Tester access is now active.");
    } else {
      Alert.alert("Invalid code", "That code didn't work.");
    }
  }, [redeemTesterCode, code]);

  const handleClearTester = useCallback(() => {
    Alert.alert("Remove tester access", "Turn off the local Pro unlock?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void clearTesterCode(),
      },
    ]);
  }, [clearTesterCode]);

  const handleRestore = useCallback(async () => {
    setBusy("restore");
    try {
      const { success } = await restore();
      Alert.alert(
        success ? "Restore complete" : "Restore",
        success
          ? "Your purchases have been restored."
          : "No previous purchases were found.",
      );
    } finally {
      setBusy(null);
    }
  }, [restore]);

  return (
    <Screen edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + space.xs, paddingHorizontal: hPad }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={[
            styles.iconPill,
            { backgroundColor: theme.glassFill, borderColor: theme.glassBorder },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={styles.iconPill} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro status */}
        <View
          style={[
            styles.proCard,
            {
              backgroundColor: isPro ? theme.accent + "1A" : theme.bgElevated,
              borderColor: isPro ? theme.accent : theme.glassBorder,
            },
          ]}
        >
          <View style={styles.proRow}>
            <Ionicons
              name={isPro ? "star" : "star-outline"}
              size={24}
              color={isPro ? theme.accent : theme.textSecondary}
            />
            <View style={styles.proText}>
              <Text style={[styles.proTitle, { color: theme.text }]}>
                {isPro
                  ? isTester
                    ? "Pro unlocked (tester)"
                    : "Pro unlocked"
                  : "Moment Tracker Pro"}
              </Text>
              <Text style={[styles.proSub, { color: theme.textSecondary }]}>
                {isPro
                  ? "Thanks for your support!"
                  : "Unlimited moments, repeating reminders, multiple widgets, import/export, and no ads."}
              </Text>
            </View>
          </View>
          {!isPro && (
            <Pressable
              onPress={() => void showPaywall()}
              style={[styles.cta, { backgroundColor: theme.accent }]}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>Upgrade to Pro</Text>
            </Pressable>
          )}
          {isPro && !isTester && isAvailable && (
            <Pressable
              onPress={() => void showCustomerCenter()}
              style={[styles.ctaGhost, { borderColor: theme.glassBorder }]}
              accessibilityRole="button"
            >
              <Text style={[styles.ctaGhostText, { color: theme.text }]}>
                Manage subscription
              </Text>
            </Pressable>
          )}
        </View>

        {/* Appearance */}
        <SectionLabel theme={theme}>APPEARANCE</SectionLabel>
        <View
          style={[
            styles.group,
            { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.appearanceHeader}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>
              Theme color
            </Text>
            <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
              Used for buttons, counters, and accents across the app
            </Text>
          </View>
          <View style={styles.swatchRow}>
            {presets.map((p) => {
              const selected = p.id === accentId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setAccent(p.id)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: p.accent,
                      borderColor: selected ? theme.text : "transparent",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name} theme color`}
                  accessibilityState={{ selected }}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Data */}
        <SectionLabel theme={theme}>DATA</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
          <SettingRow
            theme={theme}
            icon="download-outline"
            label="Import moments"
            sublabel="Restore from a .json or .csv file"
            locked={!isPro}
            loading={busy === "import"}
            onPress={() => void handleImport()}
          />
          <Divider theme={theme} />
          <SettingRow
            theme={theme}
            icon="document-text-outline"
            label="Export as JSON"
            sublabel="Full backup, re-importable"
            locked={!isPro}
            loading={busy === "export-json"}
            onPress={() => void handleExport("json")}
          />
          <Divider theme={theme} />
          <SettingRow
            theme={theme}
            icon="grid-outline"
            label="Export as CSV"
            sublabel="Spreadsheet-friendly"
            locked={!isPro}
            loading={busy === "export-csv"}
            onPress={() => void handleExport("csv")}
          />
        </View>

        {/* Purchases */}
        <SectionLabel theme={theme}>PURCHASES</SectionLabel>
        <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
          <SettingRow
            theme={theme}
            icon="refresh-outline"
            label="Restore purchases"
            loading={busy === "restore"}
            onPress={() => void handleRestore()}
          />
        </View>

        {/* Tester access */}
        <SectionLabel theme={theme}>TESTER ACCESS</SectionLabel>
        {isTester ? (
          <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
            <SettingRow
              theme={theme}
              icon="flask-outline"
              label="Tester access active"
              sublabel="Pro features unlocked locally"
              onPress={handleClearTester}
            />
          </View>
        ) : (
          <View style={[styles.codeRow, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter tester code"
              placeholderTextColor={theme.textTertiary}
              style={[styles.codeInput, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => void handleRedeem()}
            />
            <Pressable
              onPress={() => void handleRedeem()}
              disabled={code.trim().length === 0}
              style={[
                styles.codeBtn,
                {
                  backgroundColor:
                    code.trim().length === 0 ? theme.glassFill : theme.accent,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.codeBtnText,
                  { color: code.trim().length === 0 ? theme.textTertiary : "#FFFFFF" },
                ]}
              >
                Redeem
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function SectionLabel({ theme, children }: { theme: Theme; children: string }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
      {children}
    </Text>
  );
}

function Divider({ theme }: { theme: Theme }) {
  return <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />;
}

function SettingRow({
  theme,
  icon,
  label,
  sublabel,
  locked,
  loading,
  onPress,
}: {
  theme: Theme;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sublabel?: string;
  locked?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={theme.textSecondary} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : locked ? (
        <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  proCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
    marginBottom: space.md,
  },
  proRow: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "flex-start",
  },
  proText: {
    flex: 1,
    gap: 4,
  },
  proTitle: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  proSub: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  cta: {
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  ctaGhost: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.md,
    alignItems: "center",
  },
  ctaGhostText: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: space.md,
    marginBottom: space.xs,
    marginLeft: space.xs,
  },
  group: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  appearanceHeader: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: 2,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: typography.caption,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: space.lg + 20 + space.md,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.sm,
  },
  codeInput: {
    flex: 1,
    fontSize: typography.body,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  codeBtn: {
    borderRadius: radii.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  codeBtnText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
