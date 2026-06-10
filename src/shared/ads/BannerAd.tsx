import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import { useAdConsent } from "./useAdConsent";

export interface AdBannerProps {
  isPro?: boolean;
}

/**
 * Bottom banner ad with safe area, fade-in on load, and reload when app
 * returns to foreground.
 */
export function AdBanner({ isPro = false }: AdBannerProps) {
  const insets = useSafeAreaInsets();
  const { requestNonPersonalizedAdsOnly } = useAdConsent();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [adKey, setAdKey] = useState(0);
  const appState = useRef(AppState.currentState);

  const unitId = getAdUnitId("banner");

  const handleAdLoaded = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        setAdKey((prev) => prev + 1);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  if (isPro || unitId == null) {
    return null;
  }

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.bannerContainer, { opacity: fadeAnim }]}>
        <BannerAd
          key={adKey}
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={(e) => {
            if (__DEV__) console.warn("[AdBanner] Failed to load:", e?.message);
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    alignItems: "center",
  },
  bannerContainer: {
    width: "100%",
    alignItems: "center",
  },
});
