import Constants from "expo-constants";
import { Platform } from "react-native";

export function getRevenueCatApiKey(): string | null {
  const extra = (
    Constants.expoConfig as { extra?: Record<string, string | undefined> }
  )?.extra;
  if (Platform.OS === "ios") {
    return extra?.revenueCatApiKeyIos ?? null;
  }
  if (Platform.OS === "android") {
    return extra?.revenueCatApiKeyAndroid ?? null;
  }
  return null;
}
