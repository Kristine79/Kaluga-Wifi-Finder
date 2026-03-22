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
import { getApiUrl } from "@/lib/query-client";
import type { WifiCategory, WifiSpot } from "@/context/WifiContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const KALUGA: [number, number] = [54.5293, 36.2754];
const ZOOM = 13;

const CAT_PRESET: Record<string, string> = {
  cafe:       "islands#blueDotIcon",
  restaurant: "islands#redDotIcon",
  bar:        "islands#violetDotIcon",
  hotel:      "islands#cyanDotIcon",
  mall:       "islands#pinkDotIcon",
  library:    "islands#greenDotIcon",
  gym:        "islands#orangeDotIcon",
  other:      "islands#grayDotIcon",
};

const DIST_OPTIONS = [
  { label: "500m", value: 0.5 },
  { label: "1км",  value: 1   },
  { label: "2км",  value: 2   },
  { label: "5км",  value: 5   },
  { label: "10км", value: 10  },
];

const CATS: { key: WifiCategory | "all"; label: string; icon: any }[] = [
  { key: "cafe",       label: "Кафе",    icon: "cafe-outline"       },
  { key: "restaurant", label: "Еда",     icon: "restaurant-outline" },
  { key: "bar",        label: "Бары",    icon: "wine-outline"       },
  { key: "hotel",      label: "Отели",   icon: "bed-outline"        },
  { key: "mall",       label: "ТЦ",      icon: "bag-outline"        },
  { key: "library",    label: "Библ.",   icon: "library-outline"    },
];

// ─── Haversine ────────────────────────────────────────────────────────────────
function kmDist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Spot card popup ──────────────────────────────────────────────────────────
function SpotCard({ spot, onClose }: { spot: WifiSpot; onClose: () => void }) {
  const badge = spot.isOutdated
    ? { txt: "Устарело",       bg: "#FEF3C7", fg: "#92400E" }
    : spot.verified || spot.upvotes >= 5
      ? { txt: "Проверено",    bg: "#D1FAE5", fg: "#065F46" }
      : { txt: "Не проверено", bg: "#DBEAFE", fg: "#1E40AF" };

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
  wrap: { position: "absolute", bottom: 110, left: 12, right: 12, zIndex: 2000 },
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function WifiMap() {
  const mapDivRef      = useRef<any>(null);
  const mapRef         = useRef<any>(null);
  const markersRef     = useRef<any[]>([]);
  const userMarkerRef  = useRef<any>(null);
  const circleRef      = useRef<any>(null);
  const apiKeyRef      = useRef<string>("");

  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const topPad = insets.top;

  const [ready, setReady]       = useState(false);
  const [selCat, setSelCat]     = useState<WifiCategory | "all">("all");
  const [selDist, setSelDist]   = useState<number | null>(null);
  const [userLoc, setUserLoc]   = useState<[number, number] | null>(null);
  const [center, setCenter]     = useState<[number, number]>(KALUGA);
  const [activeSpot, setActiveSpot] = useState<WifiSpot | null>(null);

  // ─── Filtered spots ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    if (selCat !== "all" && s.category !== selCat) return false;
    if (selDist !== null) {
      const [clat, clng] = userLoc ?? center;
      if (kmDist(clat, clng, s.lat, s.lng) > selDist) return false;
    }
    return true;
  }), [spots, settings.verifiedOnly, selCat, selDist, userLoc, center]);

  // ─── Fetch API key + load Yandex Maps script ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const apiUrl = new URL("/api/maps-config", getApiUrl()).toString();
    fetch(apiUrl)
      .then((r) => r.json())
      .then(({ yandexMapsApiKey }: { yandexMapsApiKey: string }) => {
        if (cancelled || !yandexMapsApiKey) return;
        apiKeyRef.current = yandexMapsApiKey;

        // Inject script if not already present
        if (!document.getElementById("ymaps-script")) {
          const script = document.createElement("script");
          script.id = "ymaps-script";
          script.src = `https://api-maps.yandex.ru/2.1/?apikey=${yandexMapsApiKey}&lang=ru_RU&load=package.full`;
          document.head.appendChild(script);
        }

        // Poll until ymaps global is ready
        let attempts = 0;
        const poll = setInterval(() => {
          if (cancelled) { clearInterval(poll); return; }
          if ((window as any).ymaps) {
            clearInterval(poll);
            (window as any).ymaps.ready(() => {
              if (cancelled || mapRef.current || !mapDivRef.current) return;
              initMap((window as any).ymaps);
            });
          }
          if (attempts++ > 100) clearInterval(poll);
        }, 100);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  function initMap(ymaps: any) {
    const map = new ymaps.Map(mapDivRef.current, {
      center: KALUGA,
      zoom: ZOOM,
      controls: [],
    }, { suppressMapOpenBlock: true });

    map.controls.add("zoomControl", {
      position: { right: 10, top: 120 },
    });

    mapRef.current = map;

    map.events.add("click", () => setActiveSpot(null));

    setReady(true);
  }

  // ─── Update markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    markersRef.current.forEach((pm) => map.geoObjects.remove(pm));
    markersRef.current = [];

    filtered.forEach((spot) => {
      const preset = spot.isOutdated
        ? "islands#orangeDotIcon"
        : spot.verified || spot.upvotes >= 5
          ? "islands#greenDotIcon"
          : (CAT_PRESET[spot.category] ?? "islands#blueDotIcon");

      const pm = new ymaps.Placemark(
        [spot.lat, spot.lng],
        { hintContent: spot.name },
        { preset, hasBalloon: false },
      );

      pm.events.add("click", (e: any) => {
        e.stopPropagation();
        setActiveSpot(spot);
      });

      map.geoObjects.add(pm);
      markersRef.current.push(pm);
    });
  }, [filtered, ready]);

  // ─── User location dot ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    if (userMarkerRef.current) {
      map.geoObjects.remove(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLoc) {
      const pm = new ymaps.Placemark(
        userLoc,
        {},
        { preset: "islands#blueDotIcon", iconColor: Colors.primary },
      );
      map.geoObjects.add(pm);
      userMarkerRef.current = pm;
    }
  }, [userLoc, ready]);

  // ─── Radius circle ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    if (circleRef.current) {
      map.geoObjects.remove(circleRef.current);
      circleRef.current = null;
    }

    if (selDist !== null) {
      const [clat, clng] = userLoc ?? center;
      const circle = new ymaps.Circle(
        [[clat, clng], selDist * 1000],
        {},
        {
          fillColor: "#0065FF15",
          strokeColor: "#0065FF",
          strokeWidth: 2,
          strokeOpacity: 0.5,
        },
      );
      map.geoObjects.add(circle);
      circleRef.current = circle;
    }
  }, [selDist, userLoc, center, ready]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(loc);
      mapRef.current?.setCenter(loc, 15, { duration: 500 });
    });
  }, []);


  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Map canvas — Yandex Maps attaches to this div */}
      <View style={StyleSheet.absoluteFill}>
        {/* @ts-ignore web-only ref */}
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
      </View>

      {/* ── Top UI ── */}
      <View style={[s.top, { paddingTop: topPad }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [s.searchBar, { opacity: pressed ? 0.92 : 1 }]}
        >
          <Ionicons name="search" size={17} color="#9CA3AF" />
          <Text style={s.searchPh}>Поиск Wi-Fi точек...</Text>
        </Pressable>

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

      {/* ── Spot counter ── */}
      {!activeSpot && (
        <View style={[s.counterWrap, { top: topPad + 136 }]}>
          <Pressable
            onPress={() => router.push("/(tabs)/list")}
            style={({ pressed }) => [s.counter, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="wifi" size={14} color="#374151" />
            <Text style={s.counterTxt}>{filtered.length} точек</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* ── Spot card popup ── */}
      {activeSpot && <SpotCard spot={activeSpot} onClose={() => setActiveSpot(null)} />}

      {/* ── Bottom-right buttons ── */}
      <View style={s.fab2}>
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

  counterWrap: { position: "absolute", left: 12, zIndex: 1000 },
  counter: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 6, elevation: 3,
  },
  counterTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#374151" },

  fab2: { position: "absolute", right: 14, bottom: 110, zIndex: 1000 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  fab: {
    position: "absolute", right: 14, bottom: 168, zIndex: 1000,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});
