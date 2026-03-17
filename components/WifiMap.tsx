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
import type { WifiCategory, WifiSpot } from "@/context/WifiContext";

const KALUGA_LNG = 36.2754;
const KALUGA_LAT = 54.5293;

const DISTANCE_OPTIONS = [
  { label: "500m", value: 0.5 },
  { label: "1km",  value: 1 },
  { label: "2km",  value: 2 },
  { label: "5km",  value: 5 },
  { label: "15km", value: 15 },
];

const CATEGORIES: { key: WifiCategory | "all"; label: string; icon: any }[] = [
  { key: "all",        label: "Все",    icon: "grid-outline" },
  { key: "cafe",       label: "Кафе",   icon: "cafe-outline" },
  { key: "restaurant", label: "Еда",    icon: "restaurant-outline" },
  { key: "bar",        label: "Бары",   icon: "wine-outline" },
  { key: "hotel",      label: "Отели",  icon: "bed-outline" },
  { key: "library",    label: "Библ.",  icon: "library-outline" },
  { key: "mall",       label: "ТЦ",     icon: "bag-outline" },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeCircleGeoJSON(lng: number, lat: number, radiusKm: number) {
  const pts = 64;
  const coords: [number, number][] = [];
  const dx = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const dy = radiusKm / 110.574;
  for (let i = 0; i <= pts; i++) {
    const θ = (i / pts) * 2 * Math.PI;
    coords.push([lng + dx * Math.cos(θ), lat + dy * Math.sin(θ)]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
}

function makeMarkerEl(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "width:28px;height:28px;border-radius:50%;",
    `background:${color};border:2.5px solid #fff;`,
    "box-shadow:0 2px 8px rgba(0,0,0,0.3);",
    "cursor:pointer;display:flex;align-items:center;justify-content:center;",
    "transition:transform 0.12s;",
  ].join("");
  el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="white" stroke-width="2.5" stroke-linecap="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1.5" fill="white" stroke="none"/>
  </svg>`;
  el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
  el.onmouseleave = () => { el.style.transform = "scale(1)"; };
  return el;
}

// Native popup component
function SpotPopup({ spot, onClose }: { spot: WifiSpot; onClose: () => void }) {
  const badge = spot.isOutdated
    ? { text: "⚠️ Устарело", bg: "#FEF3C7", color: "#92400E" }
    : spot.verified || spot.upvotes >= 5
      ? { text: "✅ Проверено", bg: "#D1FAE5", color: "#065F46" }
      : { text: "🔄 Не проверено", bg: "#DBEAFE", color: "#1E40AF" };

  return (
    <View style={popup.overlay} pointerEvents="box-none">
      <View style={popup.card}>
        {/* Header */}
        <View style={popup.row}>
          <Text style={popup.name} numberOfLines={2}>{spot.name}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={popup.close}>
            <Ionicons name="close" size={18} color="#6B7280" />
          </Pressable>
        </View>
        <View style={[popup.badge, { backgroundColor: badge.bg }]}>
          <Text style={[popup.badgeText, { color: badge.color }]}>{badge.text}</Text>
        </View>
        <Text style={popup.address} numberOfLines={1}>📍 {spot.address}</Text>

        {/* SSID */}
        <View style={popup.ssidBox}>
          <Text style={popup.ssidLabel}>СЕТЬ</Text>
          <Text style={popup.ssid}>{spot.ssid}</Text>
        </View>

        {/* Password */}
        {spot.password ? (
          <View style={popup.passRow}>
            <Text style={popup.passIcon}>🔑</Text>
            <Text style={popup.passText}>{spot.password}</Text>
          </View>
        ) : (
          <Text style={popup.openNet}>🔓 Открытая сеть</Text>
        )}

        {/* Footer */}
        <View style={popup.footer}>
          <Text style={popup.votes}>👍 {spot.upvotes} · 👎 {spot.downvotes}</Text>
          <Pressable
            onPress={() => { onClose(); router.push(`/spot/${spot.id}` as any); }}
            style={({ pressed }) => [popup.detailBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={popup.detailBtnText}>Подробнее →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const popup = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 110,
    left: 12,
    right: 12,
    zIndex: 2000,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#111",
    lineHeight: 20,
  },
  close: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  address: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  ssidBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  ssidLabel: {
    fontSize: 9,
    color: "#6B7280",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 1,
    letterSpacing: 0.5,
  },
  ssid: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1D4ED8",
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  passIcon: { fontSize: 14 },
  passText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#111",
  },
  openNet: {
    fontSize: 12,
    color: "#059669",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  votes: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  detailBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  detailBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WifiMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const maplibreRef = useRef<any>(null);
  const filteredSpotsRef = useRef<WifiSpot[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const { spots, settings } = useWifi();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<WifiCategory | "all">("all");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState({ lat: KALUGA_LAT, lng: KALUGA_LNG });
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<WifiSpot | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (selectedRadius !== null) {
      const c = userLocation ?? searchCenter;
      if (haversineKm(c.lat, c.lng, s.lat, s.lng) > selectedRadius) return false;
    }
    return true;
  });

  // Keep ref in sync for use inside map callbacks
  filteredSpotsRef.current = filteredSpots;

  // ─── Add/update markers ─────────────────────────────────────────────────────
  const updateMarkers = useCallback((spotsToAdd: WifiSpot[]) => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;

    // Remove old
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spotsToAdd.forEach((spot) => {
      const color = spot.isOutdated
        ? Colors.outdated
        : spot.verified || spot.upvotes >= 5
          ? Colors.verified
          : Colors.unverified;

      const el = makeMarkerEl(color);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedSpot(spot);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, []);

  // ─── Init MapLibre once ─────────────────────────────────────────────────────
  useEffect(() => {
    const container = mapDivRef.current;
    if (!container) return;
    let cancelled = false;

    import("maplibre-gl").then((mod) => {
      if (cancelled || mapRef.current) return;
      const maplibregl = (mod as any).default ?? mod;
      maplibreRef.current = maplibregl;

      const style = isDark
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

      const map = new maplibregl.Map({
        container,
        style,
        center: [KALUGA_LNG, KALUGA_LAT],
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left"
      );

      map.on("click", () => setSelectedSpot(null));

      let moveTimer: any;
      map.on("moveend", () => {
        if (cancelled) return;
        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => setShowSearchArea(true), 500);
      });

      map.on("load", () => {
        if (cancelled) return;

        // Radius circle
        map.addSource("radius-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "radius-fill",
          type: "fill",
          source: "radius-src",
          paint: { "fill-color": "#0065FF", "fill-opacity": 0.1 },
        });
        map.addLayer({
          id: "radius-stroke",
          type: "line",
          source: "radius-src",
          paint: { "line-color": "#0065FF", "line-width": 2, "line-opacity": 0.5 },
        });

        // User dot
        map.addSource("user-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "user-halo",
          type: "circle",
          source: "user-src",
          paint: { "circle-radius": 14, "circle-color": "#0065FF", "circle-opacity": 0.18 },
        });
        map.addLayer({
          id: "user-dot",
          type: "circle",
          source: "user-src",
          paint: {
            "circle-radius": 7,
            "circle-color": "#0065FF",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#fff",
          },
        });

        mapRef.current = map;
        setMapReady(true);
        // Add initial markers
        updateMarkers(filteredSpotsRef.current);
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      setMapReady(false);
    };
  }, []); // only once

  // ─── Re-add markers when filters change ────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    updateMarkers(filteredSpots);
    setSelectedSpot(null);
  }, [filteredSpots, mapReady, updateMarkers]);

  // ─── Tile style when theme changes ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
    map.setStyle(style);
    map.once("styledata", () => {
      if (!map.getSource("radius-src")) {
        map.addSource("radius-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "radius-fill", type: "fill", source: "radius-src", paint: { "fill-color": "#0065FF", "fill-opacity": 0.1 } });
        map.addLayer({ id: "radius-stroke", type: "line", source: "radius-src", paint: { "line-color": "#0065FF", "line-width": 2, "line-opacity": 0.5 } });
      }
      if (!map.getSource("user-src")) {
        map.addSource("user-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "user-halo", type: "circle", source: "user-src", paint: { "circle-radius": 14, "circle-color": "#0065FF", "circle-opacity": 0.18 } });
        map.addLayer({ id: "user-dot", type: "circle", source: "user-src", paint: { "circle-radius": 7, "circle-color": "#0065FF", "circle-stroke-width": 2.5, "circle-stroke-color": "#fff" } });
      }
      updateMarkers(filteredSpotsRef.current);
    });
  }, [isDark]);

  // ─── Radius circle update ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource("radius-src") as any;
    if (!src) return;
    if (selectedRadius !== null) {
      const c = userLocation ?? searchCenter;
      src.setData({ type: "FeatureCollection", features: [makeCircleGeoJSON(c.lng, c.lat, selectedRadius)] });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [selectedRadius, userLocation, searchCenter, mapReady]);

  // ─── User location dot ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource("user-src") as any;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: userLocation
        ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] } }]
        : [],
    });
  }, [userLocation, mapReady]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15, duration: 1000 });
    });
  }, []);

  const handleSearchArea = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setSearchCenter({ lat: c.lat, lng: c.lng });
    setShowSearchArea(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Map fills the entire container */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore */}
        <div
          ref={mapDivRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </View>

      {/* Floating top UI */}
      <View style={[styles.topContainer, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [styles.searchBar, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Поиск Wi-Fi точек...</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
        </Pressable>

        {/* Distance chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {DISTANCE_OPTIONS.map((opt) => {
            const active = selectedRadius === opt.value;
            return (
              <Pressable
                key={opt.label}
                onPress={() => setSelectedRadius(active ? null : opt.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? Colors.primary : "rgba(255,255,255,0.95)",
                    borderColor: active ? Colors.primary : "rgba(0,0,0,0.1)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.chipLabel, { color: active ? "#fff" : "#374151" }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category chips */}
        {settings.categoryFilter && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? Colors.primary : "rgba(255,255,255,0.95)",
                      borderColor: active ? Colors.primary : "rgba(0,0,0,0.08)",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons name={cat.icon} size={13} color={active ? "#fff" : "#6B7280"} />
                  <Text style={[styles.chipLabel, { color: active ? "#fff" : "#374151" }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Search this area */}
      {showSearchArea && !selectedSpot && (
        <View style={styles.searchAreaWrap} pointerEvents="box-none">
          <Pressable
            onPress={handleSearchArea}
            style={({ pressed }) => [styles.searchAreaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="search" size={14} color={Colors.primary} />
            <Text style={styles.searchAreaText}>Search this area</Text>
          </Pressable>
        </View>
      )}

      {/* Spot popup (native React view — no DOM layout issues) */}
      {selectedSpot && (
        <SpotPopup spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
      )}

      {/* Spot count */}
      {!selectedSpot && (
        <View style={styles.spotCount} pointerEvents="none">
          <Text style={styles.spotCountText}>{filteredSpots.length} точек</Text>
        </View>
      )}

      {/* Bottom-right: refresh + locate */}
      <View style={styles.bottomRight}>
        <Pressable
          onPress={handleSearchArea}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1, marginBottom: 10 }]}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </Pressable>
        <Pressable
          onPress={handleLocate}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="locate" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/add")}
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" as any },
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
  row: {
    paddingHorizontal: 2,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
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
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  searchAreaWrap: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 900,
  },
  searchAreaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  searchAreaText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  spotCount: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 900,
  },
  spotCountText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  bottomRight: {
    position: "absolute",
    right: 14,
    bottom: 110,
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
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  fab: {
    position: "absolute",
    left: 14,
    bottom: 110,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
});
