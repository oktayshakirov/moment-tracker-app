import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
import {
  APP_NAME,
  getPlanLabel,
  handleBugReport,
  handleFeatureRequest,
  handlePartnership,
  handleRateApp,
} from "./connectActions";

type Tab = "settings" | "connect" | "plan";

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useAppTheme();
  const { accentId, presets, setAccent } = useThemeController();
  const insets = useSafeAreaInsets();
  const hPad = useContentPadding();
  const { moments, categories } = useRepositories();
  const {
    isPro,
    isDevPro,
    isAvailable: revenueCatAvailable,
    customerInfo,
    showPaywall,
    openStoreSubscriptions,
    restore,
    setDevPro,
  } = usePro();
  const [busy, setBusy] = useState<null | "export-json" | "export-csv" | "import" | "restore">(
    null,
  );
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // The Plan tab only exists when in-app purchases are available; keep a valid
  // tab selected if it disappears.
  // The dev override lives on the Plan tab, so keep that tab reachable in dev
  // builds even when in-app purchases aren't available (e.g. the simulator).
  const showPlanTab = revenueCatAvailable || __DEV__;
  const effectiveTab: Tab =
    activeTab === "plan" && !showPlanTab ? "settings" : activeTab;
  const planLabel = getPlanLabel(customerInfo, isDevPro);

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

  const title =
    effectiveTab === "settings"
      ? "Settings"
      : effectiveTab === "connect"
        ? "Connect"
        : "Plan";

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
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBarWrap, { paddingHorizontal: hPad }]}>
        <View style={[styles.tabBar, { backgroundColor: theme.glassFill }]}>
          <TabButton
            theme={theme}
            icon="settings-outline"
            label="Settings"
            active={effectiveTab === "settings"}
            onPress={() => setActiveTab("settings")}
          />
          <TabButton
            theme={theme}
            icon="chatbubble-ellipses-outline"
            label="Connect"
            active={effectiveTab === "connect"}
            onPress={() => setActiveTab("connect")}
          />
          {showPlanTab && (
            <TabButton
              theme={theme}
              icon="card-outline"
              label="Plan"
              active={effectiveTab === "plan"}
              onPress={() => setActiveTab("plan")}
            />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {effectiveTab === "settings" && (
          <>
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

          </>
        )}

        {effectiveTab === "connect" && (
          <>
            <SectionLabel theme={theme}>FEEDBACK</SectionLabel>
            <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
              <SettingRow
                theme={theme}
                icon="bug-outline"
                iconColor={theme.danger}
                label="Report a Bug"
                onPress={handleBugReport}
              />
              <Divider theme={theme} />
              <SettingRow
                theme={theme}
                icon="bulb-outline"
                label="Suggest a Feature"
                onPress={handleFeatureRequest}
              />
            </View>

            <SectionLabel theme={theme}>COMMUNITY</SectionLabel>
            <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
              <SettingRow
                theme={theme}
                icon="star-outline"
                label={`Rate ${APP_NAME}`}
                onPress={() => void handleRateApp()}
              />
            </View>

            <SectionLabel theme={theme}>BUSINESS</SectionLabel>
            <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
              <SettingRow
                theme={theme}
                icon="rocket-outline"
                label="Work with Us"
                onPress={handlePartnership}
              />
            </View>
          </>
        )}

        {effectiveTab === "plan" && (
          <>
            {/* Current plan */}
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
                  <Text style={[styles.proSub, { color: theme.textSecondary }]}>
                    Current plan
                  </Text>
                  <Text style={[styles.proTitle, { color: theme.text }]}>
                    {isPro ? planLabel : "Free"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.proSub, { color: theme.textSecondary }]}>
                {isPro
                  ? "Thanks for your support!"
                  : "Unlimited moments, repeating reminders, multiple widgets, import/export, and no ads."}
              </Text>
              {!isPro && (
                <Pressable
                  onPress={() => void showPaywall()}
                  style={[styles.cta, { backgroundColor: theme.accent }]}
                  accessibilityRole="button"
                >
                  <Text style={styles.ctaText}>Upgrade to Pro</Text>
                </Pressable>
              )}
            </View>

            {isPro && (
              <>
                <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
                  <SettingRow
                    theme={theme}
                    icon="card-outline"
                    label={`Manage in ${Platform.OS === "ios" ? "App Store" : "Play Store"}`}
                    sublabel="Cancel, update payment, or change plan"
                    onPress={() => void openStoreSubscriptions()}
                  />
                </View>
                <View
                  style={[
                    styles.tipCard,
                    { backgroundColor: theme.accent + "1A", borderColor: theme.accent + "55" },
                  ]}
                >
                  <Text style={[styles.tipTitle, { color: theme.accent }]}>
                    Thank you for supporting {APP_NAME}
                  </Text>
                  <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
                    Your purchase unlocks Pro benefits forever. You'll also
                    receive any future features and improvements we add to the
                    app at no extra cost.
                  </Text>
                </View>
              </>
            )}

            {/* Restore purchases */}
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

            {/* Developer-only Pro override */}
            {__DEV__ && (
              <>
                <SectionLabel theme={theme}>DEVELOPER</SectionLabel>
                <View style={[styles.group, { backgroundColor: theme.bgElevated, borderColor: theme.glassBorder }]}>
                  <View style={styles.row}>
                    <Ionicons name="flask-outline" size={20} color={theme.textSecondary} />
                    <View style={styles.rowText}>
                      <Text style={[styles.rowLabel, { color: theme.text }]}>
                        Pro plan (dev)
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                        Unlock Pro locally for testing
                      </Text>
                    </View>
                    <Switch
                      value={isDevPro}
                      onValueChange={(v) => void setDevPro(v)}
                      trackColor={{ true: theme.accent }}
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function TabButton({
  theme,
  icon,
  label,
  active,
  onPress,
}: {
  theme: Theme;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && { backgroundColor: theme.bgElevated }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={icon}
        size={15}
        color={active ? theme.text : theme.textTertiary}
      />
      <Text
        style={[styles.tabLabel, { color: active ? theme.text : theme.textTertiary }]}
      >
        {label}
      </Text>
    </Pressable>
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
  iconColor,
  label,
  sublabel,
  locked,
  loading,
  onPress,
}: {
  theme: Theme;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
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
      <Ionicons name={icon} size={20} color={iconColor ?? theme.textSecondary} />
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
  headerSpacer: {
    width: 44,
    height: 44,
  },
  tabBarWrap: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: space.sm,
    borderRadius: radii.sm,
  },
  tabLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
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
    gap: 2,
  },
  proTitle: {
    fontSize: typography.title2,
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
  tipCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    marginTop: space.sm,
    gap: 4,
  },
  tipTitle: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  tipBody: {
    fontSize: typography.caption,
    lineHeight: 18,
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
});
