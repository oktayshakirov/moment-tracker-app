import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { useRevenueCat, type UseRevenueCatResult } from "@/hooks/useRevenueCat";
import { hasAvailablePaywall } from "@/services/revenueCat";
import { setWidgetProStateOnIos } from "@/widgets/iosWidgetBridge";
import { getTesterOverride, setTesterOverride } from "./proCache";

export type ProContextValue = UseRevenueCatResult & {
  /** True when Pro is unlocked via the local dev override (not a real purchase). */
  isDevPro: boolean;
  /** Toggle the local dev Pro override (dev builds only). */
  setDevPro: (enabled: boolean) => Promise<void>;
};

/**
 * App-wide access to the user's Pro entitlement. `useRevenueCat` is called
 * exactly once here; every screen reads it through {@link usePro}. This wrapper
 * also adds a local tester override and a crash-safe paywall presenter.
 */
const ProContext = createContext<ProContextValue | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const rc = useRevenueCat();
  const [isDevPro, setIsDevPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getTesterOverride().then((on) => {
      if (!cancelled) setIsDevPro(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isPro = rc.isPro || isDevPro;

  // Keep the iOS widget extension's lock flag in sync with the effective
  // entitlement (real purchase or local dev override).
  useEffect(() => {
    if (!rc.entitlementResolved && !isDevPro) return;
    setWidgetProStateOnIos(isPro);
  }, [isPro, rc.entitlementResolved, isDevPro]);

  /** Present the paywall, but never crash when it isn't configured yet. */
  const showPaywall = useCallback(async () => {
    if (isPro) return;
    if (!rc.isAvailable) {
      Alert.alert(
        "Not available",
        "In-app purchases aren't available on this device.",
      );
      return;
    }
    const ready = await hasAvailablePaywall();
    if (!ready) {
      Alert.alert(
        "Pro coming soon",
        "Upgrades aren't available just yet. Please check back soon.",
      );
      return;
    }
    await rc.showPaywall();
  }, [isPro, rc]);

  const showPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (isPro) return false;
    if (!rc.isAvailable) return false;
    const ready = await hasAvailablePaywall();
    if (!ready) return false;
    return rc.showPaywallIfNeeded();
  }, [isPro, rc]);

  const setDevPro = useCallback(async (enabled: boolean): Promise<void> => {
    await setTesterOverride(enabled);
    setIsDevPro(enabled);
  }, []);

  const value: ProContextValue = {
    ...rc,
    isPro,
    showPaywall,
    showPaywallIfNeeded,
    isDevPro,
    setDevPro,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return ctx;
}
