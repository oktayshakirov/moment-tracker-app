import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomerInfo } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import {
  configureRevenueCat,
  getCustomerInfo,
  restorePurchases,
  hasProEntitlement,
  type RevenueCatError,
} from "../services/revenueCat";
import { ENTITLEMENT_PRO } from "../constants/revenueCat";

const RC_PRO_CACHE_KEY = "@momenttracker/revenuecat_pro_cache_v1";

export interface UseRevenueCatResult {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  error: RevenueCatError | null;
  refresh: () => Promise<void>;
  showPaywall: () => Promise<void>;
  showPaywallIfNeeded: () => Promise<boolean>;
  restore: () => Promise<{ success: boolean; error?: RevenueCatError }>;
  showCustomerCenter: () => Promise<void>;
  isAvailable: boolean;
  entitlementResolved: boolean;
}

export function useRevenueCat(): UseRevenueCatResult {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [cachedIsPro, setCachedIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RevenueCatError | null>(null);
  const [entitlementResolved, setEntitlementResolved] = useState(false);

  const isRealDevice = Constants.isDevice !== false;
  const isAvailable =
    (Platform.OS === "ios" || Platform.OS === "android") && isRealDevice;

  const persistProCache = useCallback(async (isPro: boolean) => {
    try {
      await AsyncStorage.setItem(RC_PRO_CACHE_KEY, isPro ? "1" : "0");
    } catch {
      // Ignore cache write failures.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCachedEntitlement() {
      try {
        const raw = await AsyncStorage.getItem(RC_PRO_CACHE_KEY);
        if (cancelled || raw == null) return;
        setCachedIsPro(raw === "1");
        setEntitlementResolved(true);
      } catch {
        // Ignore cache read failures.
      }
    }
    loadCachedEntitlement();
    return () => { cancelled = true; };
  }, []);

  const fetchCustomerInfo = useCallback(async () => {
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    const { customerInfo: info, error: err } = await getCustomerInfo();
    setError(err ?? null);
    if (!err) {
      setCustomerInfo(info ?? null);
      const hasPro = hasProEntitlement(info ?? null);
      setCachedIsPro(hasPro);
      persistProCache(hasPro);
      setEntitlementResolved(true);
    }
  }, [isAvailable, persistProCache]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!isAvailable) {
        setLoading(false);
        return;
      }
      const { ok, error: configError } = await configureRevenueCat();
      if (cancelled) return;
      if (!ok && configError) {
        setError(configError);
        setLoading(false);
        return;
      }
      await fetchCustomerInfo();
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [isAvailable, fetchCustomerInfo]);

  const refresh = useCallback(async () => {
    if (!isAvailable) return;
    setLoading(true);
    await fetchCustomerInfo();
    setLoading(false);
  }, [isAvailable, fetchCustomerInfo]);

  const showPaywall = useCallback(async () => {
    if (!isAvailable) return;
    try {
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_PRO,
        displayCloseButton: true,
      });
      await fetchCustomerInfo();
    } catch {
      await fetchCustomerInfo();
    }
  }, [isAvailable, fetchCustomerInfo]);

  const showPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_PRO,
        displayCloseButton: true,
      });
      await fetchCustomerInfo();
      return result !== PAYWALL_RESULT.NOT_PRESENTED;
    } catch {
      await fetchCustomerInfo();
      return false;
    }
  }, [isAvailable, fetchCustomerInfo]);

  const restore = useCallback(async () => {
    if (!isAvailable)
      return { success: false, error: { code: "UNSUPPORTED", message: "Not available on this platform." } };
    setLoading(true);
    const { customerInfo: info, error: err } = await restorePurchases();
    setError(err ?? null);
    if (!err) {
      setCustomerInfo(info ?? null);
      const hasPro = hasProEntitlement(info ?? null);
      setCachedIsPro(hasPro);
      persistProCache(hasPro);
      setEntitlementResolved(true);
    }
    setLoading(false);
    return { success: Boolean(info && !err), error: err ?? undefined };
  }, [isAvailable, persistProCache]);

  const showCustomerCenter = useCallback(async () => {
    if (!isAvailable) return;
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: { onRestoreCompleted: () => { fetchCustomerInfo(); } },
      });
      await fetchCustomerInfo();
    } catch {
      await fetchCustomerInfo();
    }
  }, [isAvailable, fetchCustomerInfo]);

  const isPro = hasProEntitlement(customerInfo) || cachedIsPro;

  return {
    isPro,
    customerInfo,
    loading,
    error,
    refresh,
    showPaywall,
    showPaywallIfNeeded,
    restore,
    showCustomerCenter,
    isAvailable,
    entitlementResolved,
  };
}
