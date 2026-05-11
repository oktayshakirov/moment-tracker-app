import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, useColorScheme } from "react-native";
import { MomentListScreen } from "@/features/moments/ui/MomentListScreen";
import { MomentFormScreen } from "@/features/moments/ui/MomentFormScreen";
import { MomentDetailScreen } from "@/features/moments/ui/MomentDetailScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const scheme = useColorScheme();
  const navTheme = scheme === "dark" ? DarkTheme : DefaultTheme;
  const headerIconFallback = scheme === "dark" ? "#fff" : "#000";
  return (
    <NavigationContainer
      theme={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          background: scheme === "dark" ? "#000000" : "#F2F2F7",
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
          options={{ title: "Moments", headerLargeTitle: true }}
        />
        <Stack.Screen
          name="MomentForm"
          component={MomentFormScreen}
          options={({ navigation, route }) => ({
            title: route.params?.momentId ? "Edit moment" : "New moment",
            headerLargeTitle: false,
            headerRight: ({ tintColor }) => (
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close without saving"
              >
                <Ionicons
                  name="close"
                  size={26}
                  color={tintColor ?? headerIconFallback}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="MomentDetail"
          component={MomentDetailScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
