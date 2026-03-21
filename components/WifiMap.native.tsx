import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import WebView from "react-native-webview";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWifi } from "@/context/WifiContext";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import type { WifiCategory } from "@/context/WifiContext";

const CATEGORIES: { key: WifiCategory | "all"; label: string; icon: string }[] = [
  { key: "all",        label: "Все",   icon: "grid-outline"       },
  { key: "cafe",       label: "Кафе",  icon: "cafe-outline"       },
  { key: "restaurant", label: "Еда",   icon: "restaurant-outline" },
  { key: "bar",        label: "Бары",  icon: "wine-outline"       },
  { key: "hotel",      label: "Отели", icon: "bed-outline"        },
  { key: "library",    label: "Библ.", icon: "library-outline"    },
  { key: "mall",       label: "ТЦ",   icon: "bag-outline"        },
];

function buildMapHtml(apiKey: string, spotsJson: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU&load=package.full"></script>
  <script>
    var ALL_SPOTS = ${spotsJson};
    var currentCategory = 'all';
    var map = null;
    var collection = null;
    var userMarker = null;

    var CAT_PRESET = {
      cafe:       'islands#blueDotIcon',
      restaurant: 'islands#redDotIcon',
      bar:        'islands#violetDotIcon',
      hotel:      'islands#cyanDotIcon',
      mall:       'islands#pinkDotIcon',
      library:    'islands#greenDotIcon',
      gym:        'islands#orangeDotIcon',
      other:      'islands#grayDotIcon'
    };

    function postMsg(data) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    ymaps.ready(function() {
      map = new ymaps.Map('map', {
        center: [54.5293, 36.2754],
        zoom: 12,
        controls: ['zoomControl']
      }, { suppressMapOpenBlock: true });

      collection = new ymaps.GeoObjectCollection();
      map.geoObjects.add(collection);

      renderMarkers();
      postMsg({ type: 'ready' });
    });

    function renderMarkers() {
      if (!collection) return;
      collection.removeAll();
      ALL_SPOTS.forEach(function(spot) {
        if (currentCategory !== 'all' && spot.category !== currentCategory) return;

        var preset = spot.isOutdated
          ? 'islands#orangeDotIcon'
          : (spot.verified || spot.upvotes >= 5)
            ? 'islands#greenDotIcon'
            : (CAT_PRESET[spot.category] || 'islands#blueDotIcon');

        var pm = new ymaps.Placemark(
          [spot.lat, spot.lng],
          { hintContent: spot.name },
          { preset: preset, hasBalloon: false }
        );

        pm.events.add('click', (function(s) {
          return function() {
            postMsg({ type: 'spotClick', id: s.id });
          };
        })(spot));

        collection.add(pm);
      });
    }

    function setCategory(cat) {
      currentCategory = cat;
      renderMarkers();
    }

    function setCenter(lat, lng, zoom) {
      if (map) map.setCenter([lat, lng], zoom || 15, { duration: 400 });
    }

    function addUserMarker(lat, lng) {
      if (!map) return;
      if (userMarker) map.geoObjects.remove(userMarker);
      userMarker = new ymaps.Placemark(
        [lat, lng],
        {},
        { preset: 'islands#blueCircleDotIcon' }
      );
      map.geoObjects.add(userMarker);
    }

    function updateSpots(json) {
      ALL_SPOTS = JSON.parse(json);
      renderMarkers();
    }
  </script>
</body>
</html>`;
}

export default function WifiMap() {
  const { spots, settings } = useWifi();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [locationPermission, requestPermission] = Location.useForegroundPermissions();
  const [selectedCategory, setSelectedCategory] = useState<WifiCategory | "all">("all");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch Yandex Maps API key from backend
  useEffect(() => {
    const url = new URL("/api/maps-config", getApiUrl()).toString();
    fetch(url)
      .then((r) => r.json())
      .then(({ yandexMapsApiKey }: { yandexMapsApiKey: string }) => {
        if (yandexMapsApiKey) setApiKey(yandexMapsApiKey);
      })
      .catch(() => {});
  }, []);

  const filteredSpots = useMemo(() => spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified && s.upvotes < 5) return false;
    return true;
  }), [spots, settings.verifiedOnly]);

  // Update markers when spots change (after map is ready)
  useEffect(() => {
    if (!mapReady) return;
    const json = JSON.stringify(filteredSpots);
    webViewRef.current?.injectJavaScript(`updateSpots(${JSON.stringify(json)}); true;`);
  }, [filteredSpots, mapReady]);

  // Update category filter
  useEffect(() => {
    if (!mapReady) return;
    webViewRef.current?.injectJavaScript(`setCategory('${selectedCategory}'); true;`);
  }, [selectedCategory, mapReady]);

  const htmlContent = useMemo(() => {
    if (!apiKey) return null;
    return buildMapHtml(apiKey, JSON.stringify(filteredSpots));
  }, [apiKey]);

  const handleLocate = useCallback(async () => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!locationPermission?.granted) {
      await requestPermission();
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude: lat, longitude: lng } = loc.coords;
    webViewRef.current?.injectJavaScript(`addUserMarker(${lat}, ${lng}); setCenter(${lat}, ${lng}, 15); true;`);
  }, [locationPermission, settings.hapticFeedback, requestPermission]);

  const handleCategorySelect = (cat: WifiCategory | "all") => {
    if (settings.hapticFeedback) Haptics.selectionAsync();
    setSelectedCategory(cat);
  };

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "spotClick") {
        if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/spot/${data.id}` as any);
      }
      if (data.type === "ready") {
        setMapReady(true);
      }
    } catch {}
  }, [settings.hapticFeedback]);

  return (
    <View style={styles.container}>
      {/* ── Yandex Map via WebView ── */}
      {htmlContent ? (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
          allowFileAccess
          geolocationEnabled
          scrollEnabled={false}
          overScrollMode="never"
        />
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Загрузка карты...</Text>
        </View>
      )}

      {/* ── Top overlay ── */}
      <View style={[styles.topContainer, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.push("/(tabs)/list")}
          style={({ pressed }) => [styles.searchBar, { opacity: pressed ? 0.92 : 1 }]}
        >
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Поиск Wi-Fi точек...</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
        </Pressable>

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
                  onPress={() => handleCategorySelect(cat.key)}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? Colors.primary : "rgba(255,255,255,0.95)",
                      borderColor: active ? Colors.primary : "rgba(0,0,0,0.08)",
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

      {/* ── Bottom buttons ── */}
      <View style={[styles.bottomButtons, { bottom: insets.bottom + 100 }]}>
        <Pressable
          onPress={handleLocate}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* ── FAB (add spot) ── */}
      <Pressable
        onPress={() => {
          if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add");
        }}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 158, opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* ── Spot counter ── */}
      <View style={[styles.spotCount, { bottom: insets.bottom + 102 }]}>
        <Text style={styles.spotCountText}>{filteredSpots.length} точек</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
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
    shadowOpacity: 0.12,
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
  bottomButtons: {
    position: "absolute",
    right: 16,
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
    alignSelf: "center",
    left: 16,
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
