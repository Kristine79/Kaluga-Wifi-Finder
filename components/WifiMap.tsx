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
  { key: "cafe",       label: "Cafes",  icon: "cafe-outline" },
  { key: "restaurant", label: "Food",   icon: "restaurant-outline" },
  { key: "bar",        label: "Bars",   icon: "wine-outline" },
  { key: "hotel",      label: "Hotels", icon: "bed-outline" },
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

function makeWifiMarkerEl(color: string) {
  const el = document.createElement("div");
  el.style.cssText = `
    width:30px;height:30px;border-radius:50%;
    background:${color};border:2.5px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.28);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:transform 0.15s;
  `;
  el.onmouseenter = () => (el.style.transform = "scale(1.25)");
  el.onmouseleave = () => (el.style.transform = "scale(1)");
  el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="white" stroke="none"/>
  </svg>`;
  return el;
}

export default function WifiMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { spots, settings } = useWifi();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<WifiCategory | "all">("all");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>({ lat: KALUGA_LAT, lng: KALUGA_LNG });
  const [showSearchArea, setShowSearchArea] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Compute filtered spots
  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (selectedRadius !== null) {
      const center = userLocation ?? searchCenter;
      if (haversineKm(center.lat, center.lng, s.lat, s.lng) > selectedRadius) return false;
    }
    return true;
  });

  // Register navigation handler
  useEffect(() => {
    (window as any).__wifiNavigate = (id: string) => router.push(`/spot/${id}` as any);
    return () => { delete (window as any).__wifiNavigate; };
  }, []);

  // Init MapLibre once
  useEffect(() => {
    const container = mapDivRef.current;
    if (!container) return;
    let cancelled = false;

    import("maplibre-gl").then((mod) => {
      if (cancelled || mapRef.current) return;
      const maplibregl = (mod as any).default ?? mod;

      const style = isDark
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

      const map = new maplibregl.Map({
        container,
        style,
        center: [KALUGA_LNG, KALUGA_LAT],
        zoom: 12,
        attributionControl: false,
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      // Show "Search this area" on map move
      let moveTimer: any;
      map.on("moveend", () => {
        if (cancelled) return;
        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => setShowSearchArea(true), 400);
      });

      map.on("load", () => {
        if (cancelled) return;

        // Radius circle sources/layers
        map.addSource("radius-fill-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "radius-fill",
          type: "fill",
          source: "radius-fill-src",
          paint: { "fill-color": "#0065FF", "fill-opacity": 0.1 },
        });
        map.addLayer({
          id: "radius-stroke",
          type: "line",
          source: "radius-fill-src",
          paint: { "line-color": "#0065FF", "line-width": 1.5, "line-opacity": 0.5 },
        });

        // User location dot
        map.addSource("user-loc-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "user-dot-halo",
          type: "circle",
          source: "user-loc-src",
          paint: { "circle-radius": 14, "circle-color": "#0065FF", "circle-opacity": 0.18 },
        });
        map.addLayer({
          id: "user-dot",
          type: "circle",
          source: "user-loc-src",
          paint: {
            "circle-radius": 7,
            "circle-color": "#0065FF",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#fff",
          },
        });
      });

      mapRef.current = map;

      // Small delay to fix blank render
      setTimeout(() => { if (!cancelled) map.resize(); }, 150);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []); // only once

  // Re-create markers when filteredSpots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    const waitForLoad = () => {
      if (cancelled) return;
      if (!map.loaded()) { setTimeout(waitForLoad, 100); return; }

      import("maplibre-gl").then((mod) => {
        if (cancelled) return;
        const maplibregl = (mod as any).default ?? mod;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        filteredSpots.forEach((spot) => {
          const color = spot.isOutdated
            ? Colors.outdated
            : spot.verified || spot.upvotes >= 5
              ? Colors.verified
              : Colors.unverified;

          const passHtml = spot.password
            ? `<div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:8px;padding:5px 8px;margin-top:6px">
                <span>🔑</span><code style="font-size:13px;font-weight:700;color:#111">${spot.password}</code>
               </div>`
            : `<div style="color:#059669;font-size:12px;font-weight:600;margin-top:6px">🔓 Открытая сеть</div>`;

          const badge = spot.isOutdated
            ? `<span style="background:#FEF3C7;color:#92400E;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600">⚠️ Устарело</span>`
            : spot.verified || spot.upvotes >= 5
              ? `<span style="background:#D1FAE5;color:#065F46;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600">✅ Проверено</span>`
              : `<span style="background:#DBEAFE;color:#1E40AF;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600">🔄 Не проверено</span>`;

          const html = `
            <div style="font-family:-apple-system,system-ui,sans-serif">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
                <div style="font-weight:700;font-size:14px;color:#111;line-height:1.3;flex:1">${spot.name}</div>
                ${badge}
              </div>
              <div style="color:#6B7280;font-size:12px;margin-bottom:8px">📍 ${spot.address}</div>
              <div style="background:#EFF6FF;border-radius:8px;padding:6px 10px">
                <div style="font-size:10px;color:#6B7280;margin-bottom:2px">СЕТЬ</div>
                <div style="font-size:14px;font-weight:700;color:#1D4ED8">${spot.ssid}</div>
              </div>
              ${passHtml}
              <div style="display:flex;justify-content:space-between;margin-top:8px">
                <span style="font-size:11px;color:#9CA3AF">👍 ${spot.upvotes} &nbsp;👎 ${spot.downvotes}</span>
              </div>
              <button class="wifi-spot-btn" onclick="window.__wifiNavigate('${spot.id}')">Подробнее →</button>
            </div>`;

          const el = makeWifiMarkerEl(color);
          const popup = new maplibregl.Popup({ className: "wifi-popup", offset: 18, closeButton: true })
            .setHTML(html);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([spot.lng, spot.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });
      });
    };

    waitForLoad();
    return () => { cancelled = true; };
  }, [filteredSpots]);

  // Update tile style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
    map.setStyle(style);
    // Re-add sources/layers after style change
    map.once("styledata", () => {
      if (!map.getSource("radius-fill-src")) {
        map.addSource("radius-fill-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "radius-fill", type: "fill", source: "radius-fill-src", paint: { "fill-color": "#0065FF", "fill-opacity": 0.1 } });
        map.addLayer({ id: "radius-stroke", type: "line", source: "radius-fill-src", paint: { "line-color": "#0065FF", "line-width": 1.5, "line-opacity": 0.5 } });
      }
      if (!map.getSource("user-loc-src")) {
        map.addSource("user-loc-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "user-dot-halo", type: "circle", source: "user-loc-src", paint: { "circle-radius": 14, "circle-color": "#0065FF", "circle-opacity": 0.18 } });
        map.addLayer({ id: "user-dot", type: "circle", source: "user-loc-src", paint: { "circle-radius": 7, "circle-color": "#0065FF", "circle-stroke-width": 2.5, "circle-stroke-color": "#fff" } });
      }
    });
  }, [isDark]);

  // Update radius circle on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("radius-fill-src") as any;
    if (!src) return;
    if (selectedRadius !== null) {
      const c = userLocation ?? searchCenter;
      src.setData({ type: "FeatureCollection", features: [makeCircleGeoJSON(c.lng, c.lat, selectedRadius)] });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [selectedRadius, userLocation, searchCenter]);

  // Update user dot on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("user-loc-src") as any;
    if (!src) return;
    if (userLocation) {
      src.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] } }],
      });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [userLocation]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 1200 });
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
      {/* MapLibre container */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore */}
        <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
      </View>

      {/* Top overlay */}
      <View style={[styles.topContainer, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [styles.searchBar, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search WiFi spots...</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
        </Pressable>

        {/* Distance radius filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.distanceRow}
        >
          {DISTANCE_OPTIONS.map((opt) => {
            const active = selectedRadius === opt.value;
            return (
              <Pressable
                key={opt.label}
                onPress={() => setSelectedRadius(active ? null : opt.value)}
                style={({ pressed }) => [
                  styles.distanceChip,
                  {
                    backgroundColor: active ? Colors.primary : "rgba(255,255,255,0.95)",
                    borderColor: active ? Colors.primary : "rgba(0,0,0,0.1)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.distanceLabel, { color: active ? "#fff" : "#374151" }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category chips */}
        {settings.categoryFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
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
                  <Text style={[styles.catLabel, { color: active ? "#fff" : "#374151" }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* "Search this area" button */}
      {showSearchArea && (
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

      {/* Spot count */}
      <View style={styles.spotCount} pointerEvents="none">
        <Text style={styles.spotCountText}>{filteredSpots.length} точек</Text>
      </View>

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
  distanceRow: {
    paddingHorizontal: 2,
    gap: 8,
  },
  distanceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  distanceLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
  searchAreaWrap: {
    position: "absolute",
    top: "35%",
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
    backgroundColor: "rgba(0,0,0,0.55)",
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
    right: 16,
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
    left: 16,
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
