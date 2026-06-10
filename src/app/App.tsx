import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { AppDataProvider } from "./database/AppDataProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { WidgetConfigureShell } from "@/widgets/WidgetConfigureShell";
import { useWidgetConfigureLaunch } from "@/widgets/useWidgetConfigureLaunch";
import { ConsentDialog } from "@/shared/ads/ConsentDialog";

function AppBody() {
  const configure = useWidgetConfigureLaunch();

  if (Platform.OS === "android" && configure.active) {
    return (
      <WidgetConfigureShell
        widgetId={configure.widgetId}
        onDismiss={configure.dismiss}
      />
    );
  }

  return <RootNavigator />;
}

export default function App() {
  const [AdBannerComponent, setAdBannerComponent] =
    useState<React.ComponentType<{ isPro?: boolean }> | null>(null);
  const [consentCompleted, setConsentCompleted] = useState(false);

  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    (async () => {
      try {
        const { default: mobileAds } = await import(
          "react-native-google-mobile-ads"
        );
        await mobileAds().initialize();
        const { AdBanner } = await import("@/shared/ads/BannerAd");
        setAdBannerComponent(() => AdBanner);
      } catch {
        // Native module not available (e.g. Expo Go).
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppDataProvider>
            <StatusBar style="light" />
            <AppBody />
            {AdBannerComponent && (
              <AdBannerComponent
                key={consentCompleted ? "with-consent" : "pending"}
              />
            )}
            <ConsentDialog
              onConsentCompleted={() => setConsentCompleted(true)}
            />
          </AppDataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
