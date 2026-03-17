import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWifi } from "@/context/WifiContext";
import { useTheme } from "@/hooks/useTheme";
import Colors from "@/constants/colors";
import type { WifiCategory } from "@/context/WifiContext";

const KALUGA_CENTER: [number, number] = [54.5293, 36.2754];

const CATEGORIES: { key: WifiCategory | "all"; label: string; icon: any }[] = [
  { key: "all",        label: "Все",    icon: "grid-outline" },
  { key: "cafe",       label: "Кафе",   icon: "cafe-outline" },
  { key: "restaurant", label: "Еда",    icon: "restaurant-outline" },
  { key: "bar",        label: "Бары",   icon: "wine-outline" },
  { key: "hotel",      label: "Отели",  icon: "bed-outline" },
  { key: "library",    label: "Библ.",  icon: "library-outline" },
  { key: "mall",       label: "ТЦ",     icon: "bag-outline" },
];

function getCategoryColor(cat: WifiCategory | "all"): string {
  if (cat === "all") return Colors.primary;
  return (Colors as any).category?.[cat] || Colors.primary;
}

export default function WifiMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<any>(null);
  const { spots, settings } = useWifi();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<WifiCategory | "all">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    return true;
  });

  // Register navigation handler for popup buttons
  useEffect(() => {
    (window as any).__wifiNavigate = (id: string) => {
      router.push(`/spot/${id}` as any);
    };
    return () => { delete (window as any).__wifiNavigate; };
  }, []);

  // Build/rebuild Leaflet map
  useEffect(() => {
    const container = mapDivRef.current;
    if (!container) return;

    let cancelled = false;

    import("leaflet").then((mod) => {
      if (cancelled) return;
      const L = (mod as any).default ?? mod;

      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const attribution = isDark
        ? '© <a href="https://carto.com/">CARTO</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OSM</a>';

      const map = L.map(container, {
        center: KALUGA_CENTER,
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer(tileUrl, { attribution, maxZoom: 19, subdomains: "abcd" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      filteredSpots.forEach((spot) => {
        const color = spot.isOutdated
          ? Colors.outdated
          : spot.verified || spot.upvotes >= 5
            ? Colors.verified
            : Colors.unverified;

        const passHtml = spot.password
          ? `<div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:8px;padding:5px 8px;margin-top:4px"><span>🔑</span><code style="font-size:13px;font-weight:700;color:#111">${spot.password}</code></div>`
          : `<div style="color:#059669;font-size:12px;font-weight:600;margin-top:4px">🔓 Открытая сеть</div>`;

        const statusBadge = spot.isOutdated
          ? `<span style="background:#FEF3C7;color:#92400E;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">⚠️ Устарело</span>`
          : spot.verified || spot.upvotes >= 5
            ? `<span style="background:#D1FAE5;color:#065F46;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">✅ Проверено</span>`
            : `<span style="background:#DBEAFE;color:#1E40AF;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">🔄 Не проверено</span>`;

        const popupHtml = `
          <div style="font-family:-apple-system,system-ui,sans-serif">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;gap:8px">
              <div style="font-weight:700;font-size:14px;color:#111;line-height:1.3;flex:1">${spot.name}</div>
              ${statusBadge}
            </div>
            <div style="color:#6B7280;font-size:12px;margin-bottom:8px">📍 ${spot.address}</div>
            <div style="background:#EFF6FF;border-radius:8px;padding:6px 10px;margin-bottom:4px">
              <div style="font-size:10px;color:#6B7280;margin-bottom:2px">СЕТЬ</div>
              <div style="font-size:14px;font-weight:700;color:#1D4ED8">${spot.ssid}</div>
            </div>
            ${passHtml}
            <div style="display:flex;justify-content:space-between;margin-top:8px">
              <span style="font-size:11px;color:#9CA3AF">👍 ${spot.upvotes} · 👎 ${spot.downvotes}</span>
            </div>
            <button class="wifi-spot-btn" onclick="window.__wifiNavigate('${spot.id}')">Подробнее →</button>
          </div>`;

        const marker = L.circleMarker([spot.lat, spot.lng], {
          radius: 10,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.92,
        }).addTo(map);

        marker.bindPopup(popupHtml, { className: "wifi-popup", maxWidth: 260, offset: [0, -6] });
        marker.on("mouseover", function (this: any) { this.setStyle({ radius: 13, weight: 3 }); });
        marker.on("mouseout",  function (this: any) { this.setStyle({ radius: 10, weight: 2 }); });
      });

      leafletRef.current = map;
      setTimeout(() => { if (!cancelled && leafletRef.current) leafletRef.current.invalidateSize(); }, 120);
    });

    return () => {
      cancelled = true;
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, [filteredSpots, isDark]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      if (leafletRef.current) {
        leafletRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen Leaflet map */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore - web only */}
        <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
      </View>

      {/* Top overlay: search bar + category chips */}
      <View style={[styles.topContainer, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [styles.searchBar, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Поиск Wi-Fi точек...</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
        </Pressable>

        {/* Category chips */}
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
                  onPress={() => setSelectedCategory(cat.key)}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? color : "rgba(255,255,255,0.95)",
                      borderColor: active ? color : "rgba(0,0,0,0.08)",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons name={cat.icon} size={13} color={active ? "#fff" : "#6B7280"} />
                  <Text style={[styles.catLabel, { color: active ? "#fff" : "#374151" }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Spot count badge */}
      <View style={styles.spotCount} pointerEvents="none">
        <Text style={styles.spotCountText}>{filteredSpots.length} точек</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend} pointerEvents="none">
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

      {/* Bottom-right: Locate + FAB */}
      <View style={styles.bottomButtons}>
        <Pressable
          onPress={handleLocate}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/add")}
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
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
  spotCount: {
    position: "absolute",
    top: 145,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 999,
  },
  spotCountText: {
    color: "#fff",
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
    zIndex: 999,
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
    zIndex: 1000,
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
    zIndex: 1000,
  },
});
