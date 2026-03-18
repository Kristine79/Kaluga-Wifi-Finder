import React, {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWifi } from "@/context/WifiContext";
import Colors from "@/constants/colors";
import type { WifiCategory, WifiSpot } from "@/context/WifiContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const KALUGA: [number, number] = [54.5293, 36.2754];
const ZOOM = 13;

/** CARTO Positron raster — clean light style matching the reference app, no external JSON required */
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution:
        '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "carto-tiles", type: "raster" as const, source: "carto" }],
};

const DIST_OPTIONS = [
  { label: "500m", value: 0.5 },
  { label: "1km",  value: 1   },
  { label: "2km",  value: 2   },
  { label: "5km",  value: 5   },
  { label: "10km", value: 10  },
];

const CATS: { key: WifiCategory | "all"; label: string; icon: any }[] = [
  { key: "cafe",       label: "Cafes",   icon: "cafe-outline"       },
  { key: "restaurant", label: "Food",    icon: "restaurant-outline" },
  { key: "bar",        label: "Bars",    icon: "wine-outline"       },
  { key: "hotel",      label: "Hotels",  icon: "bed-outline"        },
  { key: "mall",       label: "Malls",   icon: "bag-outline"        },
  { key: "library",    label: "Library", icon: "library-outline"    },
];

// Category → blue tint shown in the reference screenshot
const CAT_COLOR: Record<string, string> = {
  cafe:       "#0065FF",
  restaurant: "#EF4444",
  bar:        "#8B5CF6",
  hotel:      "#0EA5E9",
  mall:       "#EC4899",
  library:    "#10B981",
  gym:        "#F59E0B",
  other:      "#6B7280",
};

// WiFi icon paths (simple SVG)
const WIFI_SVG = `
  <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <circle cx="12" cy="20" r="1.6" fill="white"/>
`;

// ─── Haversine ────────────────────────────────────────────────────────────────
function km(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GeoJSON circle ───────────────────────────────────────────────────────────
function circleGeoJSON(lat: number, lng: number, radiusKm: number) {
  const pts = 64, coords: [number, number][] = [];
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * 2 * Math.PI;
    const dlat = (radiusKm / 111.32) * Math.cos(a);
    const dlng = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a);
    coords.push([lng + dlng, lat + dlat]);
  }
  return { type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [coords] }, properties: {} };
}

// ─── Spot card popup ──────────────────────────────────────────────────────────
function SpotCard({ spot, onClose }: { spot: WifiSpot; onClose: () => void }) {
  const badge = spot.isOutdated
    ? { txt: "Устарело",      bg: "#FEF3C7", fg: "#92400E" }
    : spot.verified || spot.upvotes >= 5
      ? { txt: "Проверено",   bg: "#D1FAE5", fg: "#065F46" }
      : { txt: "Не проверено",bg: "#DBEAFE", fg: "#1E40AF" };

  return (
    <View style={cs.wrap} pointerEvents="box-none">
      <View style={cs.box}>
        <View style={cs.hdr}>
          <Text style={cs.name} numberOfLines={2}>{spot.name}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={cs.closeBtn}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <View style={[cs.badge, { backgroundColor: badge.bg }]}>
          <Text style={[cs.badgeTxt, { color: badge.fg }]}>{badge.txt}</Text>
        </View>

        <Text style={cs.addr} numberOfLines={1}>📍 {spot.address}</Text>

        <View style={cs.ssidBox}>
          <Text style={cs.ssidLbl}>СЕТЬ</Text>
          <Text style={cs.ssid}>{spot.ssid}</Text>
        </View>

        {spot.password
          ? <View style={cs.passRow}><Text>🔑</Text><Text style={cs.pass}>{spot.password}</Text></View>
          : <Text style={cs.open}>🔓 Открытая сеть</Text>
        }

        <View style={cs.ftr}>
          <Text style={cs.votes}>👍 {spot.upvotes}  👎 {spot.downvotes}</Text>
          <Pressable
            onPress={() => { onClose(); router.push(`/spot/${spot.id}` as any); }}
            style={({ pressed }) => [cs.btn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={cs.btnTxt}>Подробнее →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 110, left: 12, right: 12, zIndex: 2000,
  },
  box: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 14,
  },
  hdr: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  name: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: "#111", lineHeight: 20 },
  closeBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  badge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 6 },
  badgeTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  addr: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 8 },
  ssidBox: { backgroundColor: "#EFF6FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 7 },
  ssidLbl: { fontSize: 9, color: "#6B7280", fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 1 },
  ssid: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1D4ED8" },
  passRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#F3F4F6", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  pass: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#111" },
  open: { fontSize: 12, color: "#059669", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  ftr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  votes: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnTxt: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

// ─── Build marker HTML  (matches reference app: round badge + wifi icon) ──────
function markerHtml(color: string, size = 36) {
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};
    border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,.28);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
  "><svg width="18" height="18" viewBox="0 0 24 24">${WIFI_SVG}</svg></div>`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WifiMap() {
  const mapDivRef   = useRef<any>(null);
  const mapRef      = useRef<any>(null);
  const libRef      = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);
  const clickGuard  = useRef(false);
  const readyTimerRef = useRef<any>(null);

  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [ready, setReady]             = useState(false);
  const [selCat, setSelCat]           = useState<WifiCategory | "all">("all");
  const [selDist, setSelDist]         = useState<number | null>(null);
  const [userLoc, setUserLoc]         = useState<[number, number] | null>(null);
  const [center, setCenter]           = useState<[number, number]>(KALUGA);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [activeSpot, setActiveSpot]   = useState<WifiSpot | null>(null);

  // ─── filtered spots ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selCat !== "all" && s.category !== selCat) return false;
    if (selDist !== null) {
      const [clat, clng] = userLoc ?? center;
      if (km(clat, clng, s.lat, s.lng) > selDist) return false;
    }
    return true;
  }), [spots, settings.verifiedOnly, selCat, selDist, userLoc, center]);

  // ─── Init map once ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el || mapRef.current) return;
    let cancelled = false;

    import("maplibre-gl").then((mod) => {
      if (cancelled || mapRef.current) return;
      const L = (mod as any).default ?? mod;
      libRef.current = L;

      const map = new L.Map({
        container: el,
        style: MAP_STYLE,
        center: [KALUGA[1], KALUGA[0]],   // maplibre: [lng, lat]
        zoom: ZOOM,
        attributionControl: false,
        maxZoom: 19,
      });

      // Store ref immediately so marker effect can run even before full load
      mapRef.current = map;

      map.addControl(new L.AttributionControl({ compact: true }), "bottom-left");

      map.on("click", () => {
        if (clickGuard.current) { clickGuard.current = false; return; }
        setActiveSpot(null);
      });

      let t: any;
      map.on("moveend", () => {
        clearTimeout(t);
        t = setTimeout(() => { if (!cancelled) setShowSearchArea(true); }, 800);
      });

      map.on("load", () => {
        clearTimeout(readyTimerRef.current);
        if (cancelled) return;

        // GeoJSON sources for radius circle and user location dot
        if (!map.getSource("radius-src")) {
          map.addSource("radius-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "radius-fill", type: "fill", source: "radius-src",
            paint: { "fill-color": Colors.primary, "fill-opacity": 0.07 } });
          map.addLayer({ id: "radius-stroke", type: "line", source: "radius-src",
            paint: { "line-color": Colors.primary, "line-width": 1.5, "line-opacity": 0.45 } });
        }
        if (!map.getSource("user-src")) {
          map.addSource("user-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({ id: "user-halo", type: "circle", source: "user-src",
            paint: { "circle-radius": 14, "circle-color": Colors.primary, "circle-opacity": 0.15 } });
          map.addLayer({ id: "user-dot", type: "circle", source: "user-src",
            paint: { "circle-radius": 7, "circle-color": Colors.primary,
              "circle-stroke-width": 2.5, "circle-stroke-color": "#fff" } });
        }

        if (!cancelled) setReady(true);
      });

      // Fallback: set ready after 1.5s even if load event doesn't fire
      readyTimerRef.current = setTimeout(() => {
        if (!cancelled) setReady(true);
      }, 1500);
    });

    return () => {
      cancelled = true;
      clearTimeout(readyTimerRef.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ─── Update markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L   = libRef.current;
    if (!map || !L || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((spot) => {
      const color = CAT_COLOR[spot.category] ?? Colors.primary;
      const el = document.createElement("div");
      el.innerHTML = markerHtml(color, 36);
      const markerEl = el.firstChild as HTMLElement;

      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        clickGuard.current = true;
        setActiveSpot(spot);
        setTimeout(() => { clickGuard.current = false; }, 80);
      });

      const marker = new L.Marker({ element: markerEl, anchor: "center" })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [filtered, ready]);

  // ─── Radius circle ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("radius-src");
    if (!src) return;
    if (selDist !== null) {
      const [clat, clng] = userLoc ?? center;
      (src as any).setData({
        type: "FeatureCollection",
        features: [circleGeoJSON(clat, clng, selDist)],
      });
    } else {
      (src as any).setData({ type: "FeatureCollection", features: [] });
    }
  }, [selDist, userLoc, center, ready]);

  // ─── User dot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("user-src");
    if (!src) return;
    if (userLoc) {
      (src as any).setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: { type: "Point", coordinates: [userLoc[1], userLoc[0]] }, properties: {} }],
      });
    } else {
      (src as any).setData({ type: "FeatureCollection", features: [] });
    }
  }, [userLoc, ready]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(loc);
      mapRef.current?.flyTo({ center: [loc[1], loc[0]], zoom: 15 });
    });
  }, []);

  const handleSearchArea = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setCenter([c.lat, c.lng]);
    setShowSearchArea(false);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Map canvas */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore web-only ref */}
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
      </View>

      {/* ── Top UI ── */}
      <View style={[s.top, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [s.searchBar, { opacity: pressed ? 0.92 : 1 }]}
        >
          <Ionicons name="search" size={17} color="#9CA3AF" />
          <Text style={s.searchPh}>Search WiFi spots...</Text>
        </Pressable>

        {/* Distance pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {DIST_OPTIONS.map((o) => {
            const on = selDist === o.value;
            return (
              <Pressable
                key={o.label}
                onPress={() => setSelDist(on ? null : o.value)}
                style={[s.pill, { backgroundColor: on ? Colors.primary : "#fff", borderColor: on ? Colors.primary : "#E5E7EB" }]}
              >
                <Text style={[s.pillTxt, { color: on ? "#fff" : "#374151" }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category chips (icon + label) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {CATS.map((cat) => {
            const on = selCat === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelCat(on ? "all" : cat.key)}
                style={[s.catChip, { backgroundColor: on ? Colors.primary : "#fff", borderColor: on ? Colors.primary : "#E5E7EB" }]}
              >
                <Ionicons name={cat.icon} size={13} color={on ? "#fff" : "#6B7280"} />
                <Text style={[s.catTxt, { color: on ? "#fff" : "#374151" }]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Spot counter (below filters, left-aligned) ── */}
      {!activeSpot && (
        <View style={[s.counterWrap, { top: topPad + 8 + 136 }]}>
          <Pressable
            onPress={() => router.push("/(tabs)/list")}
            style={({ pressed }) => [s.counter, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="wifi" size={14} color="#374151" />
            <Text style={s.counterTxt}>{filtered.length} spots</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* ── Search this area ── */}
      {showSearchArea && !activeSpot && (
        <View style={s.searchAreaWrap} pointerEvents="box-none">
          <Pressable
            onPress={handleSearchArea}
            style={({ pressed }) => [s.searchAreaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="refresh" size={14} color={Colors.primary} />
            <Text style={s.searchAreaTxt}>Search this area</Text>
          </Pressable>
        </View>
      )}

      {/* ── Spot card popup ── */}
      {activeSpot && <SpotCard spot={activeSpot} onClose={() => setActiveSpot(null)} />}

      {/* ── Bottom-right buttons (refresh + locate) ── */}
      <View style={s.fab2}>
        <Pressable onPress={handleSearchArea} style={({ pressed }) => [s.iconBtn, { opacity: pressed ? 0.8 : 1, marginBottom: 10 }]}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </Pressable>
        <Pressable onPress={handleLocate} style={({ pressed }) => [s.iconBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <Ionicons name="locate-outline" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* ── FAB (add spot) ── */}
      <Pressable
        onPress={() => router.push("/add")}
        style={({ pressed }) => [s.fab, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" as any },

  // Top overlay
  top: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 12, gap: 8, zIndex: 1000,
    pointerEvents: "box-none" as any,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
  searchPh: { flex: 1, fontSize: 15, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  row: { paddingHorizontal: 2, gap: 8 },

  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  pillTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  catTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Spot counter
  counterWrap: { position: "absolute", left: 12, zIndex: 1000 },
  counter: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 6, elevation: 3,
  },
  counterTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#374151" },

  // Search area
  searchAreaWrap: {
    position: "absolute", top: "40%", left: 0, right: 0,
    alignItems: "center", zIndex: 900,
  },
  searchAreaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14, shadowRadius: 8, elevation: 5,
  },
  searchAreaTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },

  // Bottom-right icon buttons
  fab2: { position: "absolute", right: 14, bottom: 110, zIndex: 1000 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },

  // FAB
  fab: {
    position: "absolute", left: 14, bottom: 110,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 1000,
  },
});
