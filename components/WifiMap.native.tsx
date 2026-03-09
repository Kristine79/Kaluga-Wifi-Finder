import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi } from "@/context/WifiContext";
import Colors from "@/constants/colors";
import type { WifiCategory } from "@/context/WifiContext";

const KALUGA_CENTER = {
  latitude: 54.5293,
  longitude: 36.2754,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const CATEGORIES: { key: WifiCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "Все", icon: "grid-outline" },
  { key: "cafe", label: "Кафе", icon: "cafe-outline" },
  { key: "restaurant", label: "Еда", icon: "restaurant-outline" },
  { key: "bar", label: "Бары", icon: "wine-outline" },
  { key: "hotel", label: "Отели", icon: "bed-outline" },
  { key: "library", label: "Библ.", icon: "library-outline" },
  { key: "mall", label: "ТЦ", icon: "bag-outline" },
];

function getMarkerColor(spot: { verified: boolean; isOutdated: boolean; upvotes: number }) {
  if (spot.isOutdated) return Colors.outdated;
  if (spot.verified || spot.upvotes >= 5) return Colors.verified;
  return Colors.unverified;
}

function getCategoryColor(cat: WifiCategory | "all"): string {
  if (cat === "all") return Colors.primary;
  return Colors.category[cat] || Colors.primary;
}

export default function WifiMap() {
  const { isDark } = useTheme();
  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [locationPermission, requestPermission] = Location.useForegroundPermissions();
  const [selectedCategory, setSelectedCategory] = useState<WifiCategory | "all">("all");

  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    return true;
  });

  const handleLocate = useCallback(async () => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!locationPermission?.granted) {
      await requestPermission();
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion(
      {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600
    );
  }, [locationPermission, settings.hapticFeedback, requestPermission]);

  const handleMarkerPress = (id: string) => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/spot/${id}`);
  };

  const handleCategorySelect = (cat: WifiCategory | "all") => {
    if (settings.hapticFeedback) Haptics.selectionAsync();
    setSelectedCategory(cat);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={KALUGA_CENTER}
        showsUserLocation={locationPermission?.granted ?? false}
        showsMyLocationButton={false}
      >
        {filteredSpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            onPress={() => handleMarkerPress(spot.id)}
            pinColor={getMarkerColor(spot)}
          />
        ))}
      </MapView>

      <View style={[styles.topContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchBar}>
          <View style={styles.searchBarInner}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Поиск Wi-Fi точек...</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/list")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        {settings.categoryFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              const color = getCategoryColor(cat.key);
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => handleCategorySelect(cat.key)}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? color : "rgba(255,255,255,0.92)",
                      borderColor: active ? color : "rgba(0,0,0,0.08)",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={13}
                    color={active ? "#fff" : "#6B7280"}
                  />
                  <Text style={[styles.catLabel, { color: active ? "#fff" : "#374151" }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.verified }]} />
          <Text style={styles.legendText}>Проверено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.unverified }]} />
          <Text style={styles.legendText}>Не проверено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.outdated }]} />
          <Text style={styles.legendText}>Устарело</Text>
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <Pressable
          onPress={handleLocate}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add");
        }}
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <View style={styles.spotCount}>
        <Text style={styles.spotCountText}>{filteredSpots.length} точек</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  categoriesRow: {
    paddingHorizontal: 2,
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  legend: {
    position: "absolute",
    left: 12,
    bottom: 100,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },
  bottomButtons: {
    position: "absolute",
    right: 16,
    bottom: 104,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 156,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  spotCount: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  spotCountText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
