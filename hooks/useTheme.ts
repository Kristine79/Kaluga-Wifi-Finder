import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { useWifi } from "@/context/WifiContext";

export function useTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useWifi();

  const effectiveTheme =
    settings.theme === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : settings.theme;

  const isDark = effectiveTheme === "dark" || effectiveTheme === "oled";
  const theme =
    effectiveTheme === "oled"
      ? Colors.oled
      : effectiveTheme === "dark"
      ? Colors.dark
      : Colors.light;

  return { theme, isDark, effectiveTheme };
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number, units: "km" | "mi"): string {
  if (units === "mi") {
    const mi = km * 0.621371;
    return mi < 0.1 ? `${Math.round(mi * 5280)} ft` : `${mi.toFixed(1)} mi`;
  }
  return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
}
