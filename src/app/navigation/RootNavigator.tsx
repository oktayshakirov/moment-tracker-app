import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MomentListScreen } from "@/features/moments/ui/MomentListScreen";
import { MomentFormScreen } from "@/features/moments/ui/MomentFormScreen";
import { MomentDetailScreen } from "@/features/moments/ui/MomentDetailScreen";
import type { RootStackParamList } from "./types";
import { rootLinking } from "./linking";
import { darkTheme } from "@/shared/theme/tokens";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Main app navigation — widget configuration uses {@link WidgetConfigureShell} instead. */
export function RootNavigator() {
  return (
    <NavigationContainer
      linking={rootLinking}
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: darkTheme.screenGradient[0],
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerLargeTitle: true,
          headerTransparent: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={MomentListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MomentForm"
          component={MomentFormScreen}
          options={{
            headerShown: false,
            headerLargeTitle: false,
            presentation: "fullScreenModal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="MomentDetail"
          component={MomentDetailScreen}
          options={{
            headerShown: false,
            headerLargeTitle: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
