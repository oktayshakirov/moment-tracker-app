import { Platform } from "react-native";

export const USE_TEST_ADS = __DEV__;

export const adUnitIDs = {
  banner: Platform.select({
    ios: "ca-app-pub-5852582960793521/5781034190",
    android: "ca-app-pub-5852582960793521/9744329939",
  }),
};

type AdType = "banner";

export function getAdUnitId(type: AdType): string | undefined {
  if (USE_TEST_ADS && type === "banner") {
    const { TestIds } = require("react-native-google-mobile-ads");
    return TestIds.BANNER;
  }
  return adUnitIDs[type];
}
