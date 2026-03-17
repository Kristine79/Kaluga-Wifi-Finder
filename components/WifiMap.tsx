import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWifi } from "@/context/WifiContext";
import { useTheme } from "@/hooks/useTheme";

const KALUGA_CENTER: [number, number] = [54.5141, 36.2773];

const CATEGORY_LABEL: Record<string, string> = {
  cafe: "Кафе",
  restaurant: "Ресторан",
  bar: "Бар",
  hotel: "Отель",
  library: "Библиотека",
  gym: "Спортзал",
  mall: "ТЦ",
  other: "Другое",
};

const SPEED_LABEL: Record<string, string> = {
  slow: "Медленный",
  moderate: "Средний",
  fast: "Быстрый",
  ultra_fast: "Очень быстрый",
};

export default function WifiMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<any>(null);
  const { spots, settings } = useWifi();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredSpots = spots.filter((s) => {
    if (settings.verifiedOnly && !s.verified) return false;
    return true;
  });

  useEffect(() => {
    (window as any).__wifiNavigate = (id: string) => {
      router.push(`/spot/${id}` as any);
    };
    return () => {
      delete (window as any).__wifiNavigate;
    };
  }, []);

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
        ? '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      const map = L.map(container, {
        center: KALUGA_CENTER,
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      filteredSpots.forEach((spot) => {
        const color = spot.isOutdated
          ? "#F59E0B"
          : spot.verified
            ? "#00C48C"
            : "#0065FF";

        const borderColor = spot.isOutdated
          ? "#D97706"
          : spot.verified
            ? "#059669"
            : "#0052CC";

        const passHtml = spot.password
          ? `<div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:8px;padding:5px 8px;margin-top:4px">
               <span style="font-size:13px">🔑</span>
               <code style="font-size:13px;font-weight:600;color:#111;letter-spacing:0.5px">${spot.password}</code>
             </div>`
          : `<div style="color:#059669;font-size:12px;font-weight:600;margin-top:4px">🔓 Открытая сеть</div>`;

        const statusBadge = spot.isOutdated
          ? `<span style="background:#FEF3C7;color:#92400E;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">⚠️ Устарело</span>`
          : spot.verified
            ? `<span style="background:#D1FAE5;color:#065F46;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">✅ Проверено</span>`
            : `<span style="background:#DBEAFE;color:#1E40AF;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600">🔄 Не проверено</span>`;

        const popupHtml = `
          <div style="font-family:-apple-system,system-ui,sans-serif">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <div style="font-weight:700;font-size:14px;color:#111;flex:1;margin-right:8px;line-height:1.3">${spot.name}</div>
              ${statusBadge}
            </div>
            <div style="color:#6B7280;font-size:12px;margin-bottom:8px">📍 ${spot.address}</div>
            <div style="background:#EFF6FF;border-radius:8px;padding:6px 10px;margin-bottom:4px">
              <div style="font-size:10px;color:#6B7280;margin-bottom:2px">СЕТЬ</div>
              <div style="font-size:14px;font-weight:700;color:#1D4ED8">${spot.ssid}</div>
            </div>
            ${passHtml}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
              <div style="font-size:11px;color:#9CA3AF">${CATEGORY_LABEL[spot.category] || "Другое"} · ${SPEED_LABEL[spot.speed] || spot.speed}</div>
              <div style="font-size:11px;color:#9CA3AF">👍${spot.upvotes} 👎${spot.downvotes}</div>
            </div>
            <button class="wifi-spot-btn" onclick="window.__wifiNavigate('${spot.id}')">
              Подробнее →
            </button>
          </div>`;

        const marker = L.circleMarker([spot.lat, spot.lng], {
          radius: 11,
          fillColor: color,
          color: borderColor,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.92,
        }).addTo(map);

        marker.bindPopup(popupHtml, {
          className: "wifi-popup",
          maxWidth: 260,
          offset: [0, -6],
        });

        marker.on("mouseover", function () {
          this.setStyle({ radius: 14, weight: 3 });
        });
        marker.on("mouseout", function () {
          this.setStyle({ radius: 11, weight: 2 });
        });
      });

      leafletRef.current = map;

      setTimeout(() => {
        if (!cancelled && leafletRef.current) {
          leafletRef.current.invalidateSize();
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [filteredSpots, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.mapWrapper, { paddingTop: topPad }]}>
        {/* @ts-ignore - web only div element */}
        <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
});
