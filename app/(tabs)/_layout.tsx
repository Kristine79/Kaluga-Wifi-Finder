import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";
import { useWifi } from "@/context/WifiContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Карта</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="list">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
        <Label>Список</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Настройки</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useWifi();

  const effectiveTheme = settings.theme === "system" ? colorScheme : settings.theme;
  const isDark = effectiveTheme === "dark" || effectiveTheme === "oled";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: isDark ? "#636366" : "#9CA3AF",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#000" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: isDark ? "#333" : "#ccc",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "#000" : "#fff" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Карта",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Список",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
