import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Last-known Pro entitlement, persisted by {@link useRevenueCat}. Read this from
 * contexts that run outside the React tree / ProProvider (e.g. the Android
 * widget configuration activity, which is its own root).
 */
export const RC_PRO_CACHE_KEY = "@momenttracker/revenuecat_pro_cache_v1";

/** Local tester override — unlocks Pro without a real purchase. */
export const TESTER_PRO_KEY = "@momenttracker/tester_pro_override";

/** Code testers enter in Settings to unlock Pro features locally. */
export const TESTER_CODE = "12345";

export async function isProCached(): Promise<boolean> {
  try {
    const [[, rc], [, tester]] = await AsyncStorage.multiGet([
      RC_PRO_CACHE_KEY,
      TESTER_PRO_KEY,
    ]);
    return rc === "1" || tester === "1";
  } catch {
    return false;
  }
}

export async function getTesterOverride(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TESTER_PRO_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setTesterOverride(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(TESTER_PRO_KEY, "1");
    } else {
      await AsyncStorage.removeItem(TESTER_PRO_KEY);
    }
  } catch {
    // Ignore persistence failures — in-memory state still applies this session.
  }
}
