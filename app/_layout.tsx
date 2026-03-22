import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { WifiProvider } from "@/context/WifiContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Назад" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{
          presentation: "formSheet",
          headerShown: false,
          sheetAllowedDetents: [0.85, 1],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="spot/[id]"
        options={{
          presentation: "formSheet",
          headerShown: false,
          sheetAllowedDetents: [0.6, 1],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          presentation: "formSheet",
          headerShown: false,
          sheetAllowedDetents: [0.85, 1],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (Platform.OS === "web") {
        (window as any).hideWebPreloader?.();
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <WifiProvider>
              <RootLayoutNav />
            </WifiProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
