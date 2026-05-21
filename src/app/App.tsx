import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { AppDataProvider } from "./database/AppDataProvider";
import { RootNavigator } from "./navigation/RootNavigator";
import { WidgetConfigureShell } from "@/widgets/WidgetConfigureShell";
import { useWidgetConfigureLaunch } from "@/widgets/useWidgetConfigureLaunch";

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppDataProvider>
            <StatusBar style="light" />
            <AppBody />
          </AppDataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
