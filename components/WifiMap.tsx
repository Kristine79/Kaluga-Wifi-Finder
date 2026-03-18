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
import Colors from "@/constants/colors";
import type { WifiCategory, WifiSpot } from "@/context/WifiContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const KALUGA: [number, number] = [54.5293, 36.2754];
const ZOOM = 13;

const DISTANCE_OPTIONS = [
  { label: "500м", value: 0.5 },
  { label: "1км",  value: 1   },
  { label: "2км",  value: 2   },
  { label: "5км",  value: 5   },
  { label: "15км", value: 15  },
];

const CATEGORIES: { key: WifiCategory | "all"; label: string; icon: any }[] = [
  { key: "all",        label: "Все",   icon: "grid-outline"       },
  { key: "cafe",       label: "Кафе",  icon: "cafe-outline"       },
  { key: "restaurant", label: "Еда",   icon: "restaurant-outline" },
  { key: "bar",        label: "Бары",  icon: "wine-outline"       },
  { key: "hotel",      label: "Отели", icon: "bed-outline"        },
  { key: "library",    label: "Библ.", icon: "library-outline"    },
  { key: "mall",       label: "ТЦ",    icon: "bag-outline"        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function spotColor(spot: WifiSpot) {
  if (spot.isOutdated) return Colors.outdated;
  if (spot.verified || spot.upvotes >= 5) return Colors.verified;
  return Colors.unverified;
}

// ─── Popup card ───────────────────────────────────────────────────────────────
function SpotCard({ spot, onClose }: { spot: WifiSpot; onClose: () => void }) {
  const badge = spot.isOutdated
    ? { label: "⚠️ Устарело",     bg: "#FEF3C7", fg: "#92400E" }
    : spot.verified || spot.upvotes >= 5
      ? { label: "✅ Проверено",   bg: "#D1FAE5", fg: "#065F46" }
      : { label: "🔄 Не проверено",bg: "#DBEAFE", fg: "#1E40AF" };

  return (
    <View style={card.wrap} pointerEvents="box-none">
      <View style={card.box}>
        {/* title + close */}
        <View style={card.row}>
          <Text style={card.name} numberOfLines={2}>{spot.name}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={card.closeBtn}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* badge + address */}
        <View style={[card.badge, { backgroundColor: badge.bg }]}>
          <Text style={[card.badgeTxt, { color: badge.fg }]}>{badge.label}</Text>
        </View>
        <Text style={card.addr} numberOfLines={1}>📍 {spot.address}</Text>

        {/* SSID */}
        <View style={card.ssidBox}>
          <Text style={card.ssidLbl}>СЕТЬ</Text>
          <Text style={card.ssid}>{spot.ssid}</Text>
        </View>

        {/* password / open */}
        {spot.password ? (
          <View style={card.passRow}>
            <Text>🔑</Text>
            <Text style={card.pass}>{spot.password}</Text>
          </View>
        ) : (
          <Text style={card.open}>🔓 Открытая сеть</Text>
        )}

        {/* footer */}
        <View style={card.footer}>
          <Text style={card.votes}>👍 {spot.upvotes}  👎 {spot.downvotes}</Text>
          <Pressable
            onPress={() => { onClose(); router.push(`/spot/${spot.id}` as any); }}
            style={({ pressed }) => [card.btn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={card.btnTxt}>Подробнее →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    left: 12,
    right: 12,
    zIndex: 2000,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
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
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  votes: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnTxt: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

// ─── Main map component ───────────────────────────────────────────────────────
export default function WifiMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef    = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef  = useRef<any>(null);
  const userDotRef = useRef<any>(null);
  const markerJustClickedRef = useRef(false);

  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [ready, setReady] = useState(false);
  const [selectedCat, setSelectedCat] = useState<WifiCategory | "all">("all");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number]>(KALUGA);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [activeSpot, setActiveSpot] = useState<WifiSpot | null>(null);

  // ─── Filtered spots ─────────────────────────────────────────────────────────
  const filtered = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selectedCat !== "all" && s.category !== selectedCat) return false;
    if (selectedRadius !== null) {
      const [clat, clng] = userLoc ?? searchCenter;
      if (haversineKm(clat, clng, s.lat, s.lng) > selectedRadius) return false;
    }
    return true;
  });

  // ─── Init Leaflet once ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el || mapRef.current) return;

    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod;

      const map = L.map(el, {
        center: KALUGA,
        zoom: ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      // ── OSM tiles ──
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // ── map click → close popup ──
      map.on("click", () => {
        if (markerJustClickedRef.current) {
          markerJustClickedRef.current = false;
          return;
        }
        setActiveSpot(null);
      });

      // ── map move → show "Search this area" ──
      let moveTimer: any;
      map.on("moveend", () => {
        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => setShowSearchArea(true), 600);
      });

      mapRef.current = map;
      setTimeout(() => { map.invalidateSize(); setReady(true); }, 120);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ─── Update markers whenever filters / ready state change ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod;

      // remove old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      filtered.forEach((spot) => {
        const color = spotColor(spot);

        // Custom circular div icon
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.30);
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;transition:transform .12s;
          "><svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" stroke-width="2.5" stroke-linecap="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1.5" fill="white" stroke="none"/>
          </svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon });

        marker.on("click", (e: any) => {
          e.originalEvent?.stopPropagation();
          markerJustClickedRef.current = true;
          setActiveSpot(spot);
          setTimeout(() => { markerJustClickedRef.current = false; }, 60);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });
    });
  }, [filtered, ready]);

  // ─── Radius circle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod;
      if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }

      if (selectedRadius !== null) {
        const [clat, clng] = userLoc ?? searchCenter;
        circleRef.current = L.circle([clat, clng], {
          radius: selectedRadius * 1000,
          color: Colors.primary,
          fillColor: Colors.primary,
          fillOpacity: 0.08,
          weight: 1.5,
          opacity: 0.5,
        }).addTo(map);
      }
    });
  }, [selectedRadius, userLoc, searchCenter, ready]);

  // ─── User location dot ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    import("leaflet").then((mod) => {
      const L = (mod as any).default ?? mod;
      if (userDotRef.current) { map.removeLayer(userDotRef.current); userDotRef.current = null; }

      if (userLoc) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:${Colors.primary};border:3px solid #fff;
            box-shadow:0 0 0 4px rgba(0,101,255,0.2);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        userDotRef.current = L.marker(userLoc, { icon, zIndexOffset: 1000 }).addTo(map);
      }
    });
  }, [userLoc, ready]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(loc);
      mapRef.current?.flyTo(loc, 15);
    });
  }, []);

  const handleSearchArea = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setSearchCenter([c.lat, c.lng]);
    setShowSearchArea(false);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Leaflet map fills everything */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore */}
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
      </View>

      {/* ── Top overlay: search + filters ── */}
      <View style={[s.top, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        {/* Search bar */}
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [s.searchBar, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <Text style={s.searchPh}>Поиск Wi-Fi точек...</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
        </Pressable>

        {/* Distance */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {DISTANCE_OPTIONS.map((opt) => {
            const on = selectedRadius === opt.value;
            return (
              <Pressable
                key={opt.label}
                onPress={() => setSelectedRadius(on ? null : opt.value)}
                style={({ pressed }) => [s.chip, { backgroundColor: on ? Colors.primary : "rgba(255,255,255,0.96)", borderColor: on ? Colors.primary : "rgba(0,0,0,0.10)", opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={[s.chipTxt, { color: on ? "#fff" : "#374151" }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Categories */}
        {settings.categoryFilter && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {CATEGORIES.map((cat) => {
              const on = selectedCat === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCat(cat.key)}
                  style={({ pressed }) => [s.catChip, { backgroundColor: on ? Colors.primary : "rgba(255,255,255,0.96)", borderColor: on ? Colors.primary : "rgba(0,0,0,0.08)", opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name={cat.icon} size={13} color={on ? "#fff" : "#6B7280"} />
                  <Text style={[s.chipTxt, { color: on ? "#fff" : "#374151" }]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Search this area ── */}
      {showSearchArea && !activeSpot && (
        <View style={s.searchAreaWrap} pointerEvents="box-none">
          <Pressable
            onPress={handleSearchArea}
            style={({ pressed }) => [s.searchAreaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="search" size={14} color={Colors.primary} />
            <Text style={s.searchAreaTxt}>Search this area</Text>
          </Pressable>
        </View>
      )}

      {/* ── Spot popup ── */}
      {activeSpot && <SpotCard spot={activeSpot} onClose={() => setActiveSpot(null)} />}

      {/* ── Spot count ── */}
      {!activeSpot && (
        <View style={s.count} pointerEvents="none">
          <Text style={s.countTxt}>{filtered.length} точек</Text>
        </View>
      )}

      {/* ── Bottom-right: refresh + locate ── */}
      <View style={s.bottomRight}>
        <Pressable onPress={handleSearchArea} style={({ pressed }) => [s.iconBtn, { opacity: pressed ? 0.8 : 1, marginBottom: 10 }]}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </Pressable>
        <Pressable onPress={handleLocate} style={({ pressed }) => [s.iconBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <Ionicons name="locate" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* ── FAB ── */}
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
  container: { flex: 1, overflow: "hidden" as any },

  top: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 12, gap: 8, zIndex: 1000,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14, shadowRadius: 8, elevation: 4,
  },
  searchPh: { flex: 1, fontSize: 15, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  chipRow: { paddingHorizontal: 2, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  catChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, gap: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  chipTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  searchAreaWrap: {
    position: "absolute", top: "38%", left: 0, right: 0,
    alignItems: "center", zIndex: 900,
  },
  searchAreaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16, shadowRadius: 8, elevation: 6,
  },
  searchAreaTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },

  count: {
    position: "absolute", bottom: 110, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, zIndex: 900,
  },
  countTxt: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  bottomRight: { position: "absolute", right: 14, bottom: 110, zIndex: 1000 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14, shadowRadius: 6, elevation: 4,
  },

  fab: {
    position: "absolute", left: 14, bottom: 110,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 1000,
  },
});
