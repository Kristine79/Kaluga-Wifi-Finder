import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi } from "@/context/WifiContext";
import Colors from "@/constants/colors";

export default function WifiMap() {
  const { theme } = useTheme();
  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const topInset = 67;

  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: topInset }]}>
      <View style={styles.iconWrap}>
        <View style={[styles.iconBg, { backgroundColor: Colors.primary + "20" }]}>
          <Ionicons name="map" size={56} color={Colors.primary} />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Wi-Fi Калуга</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Карта доступна в мобильном приложении.{"\n"}
        В браузере используйте список.
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{filteredSpots.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Точек</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: Colors.verified }]}>
            {filteredSpots.filter((s) => s.verified).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Проверено</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: Colors.outdated }]}>
            {filteredSpots.filter((s) => s.isOutdated).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Устарело</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(tabs)/list")}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: Colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="list" size={18} color="#fff" />
        <Text style={styles.btnText}>Открыть список</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/add")}
        style={({ pressed }) => [
          styles.btnOutline,
          { borderColor: Colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={18} color={Colors.primary} />
        <Text style={[styles.btnOutlineText, { color: Colors.primary }]}>Добавить точку</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
    paddingBottom: 34,
  },
  iconWrap: {
    marginBottom: 8,
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    width: "100%",
  },
  btnOutlineText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
