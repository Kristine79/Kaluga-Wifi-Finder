import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi, WifiSpot, WifiCategory } from "@/context/WifiContext";
import { haversineDistance, formatDistance } from "@/hooks/useTheme";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

const KALUGA_LAT = 54.5293;
const KALUGA_LNG = 36.2754;

type FilterTab = "all" | "favorites" | "verified";
type CategoryFilter = WifiCategory | "all";

const CATEGORY_ICONS: Record<WifiCategory, string> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  hotel: "bed",
  library: "library",
  gym: "barbell",
  mall: "bag",
  other: "wifi",
};

function SpeedBadge({ speed }: { speed: WifiSpot["speed"] }) {
  const t = useTranslation();
  const configs = {
    slow:       { color: Colors.slow,      label: t.speed.slowShort       },
    moderate:   { color: Colors.moderate,  label: t.speed.moderateShort   },
    fast:       { color: Colors.fast,      label: t.speed.fastShort       },
    ultra_fast: { color: Colors.ultraFast, label: t.speed.ultra_fastShort },
  };
  const cfg = configs[speed];
  return (
    <View style={[styles.speedBadge, { backgroundColor: cfg.color + "22" }]}>
      <View style={[styles.speedDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.speedText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function SpotCard({
  spot,
  isFav,
  theme,
  isDark,
  distanceUnits,
  onPress,
  onToggleFav,
}: {
  spot: WifiSpot;
  isFav: boolean;
  theme: typeof Colors.light;
  isDark: boolean;
  distanceUnits: "km" | "mi";
  onPress: () => void;
  onToggleFav: () => void;
}) {
  const t = useTranslation();
  const dist = haversineDistance(KALUGA_LAT, KALUGA_LNG, spot.lat, spot.lng);
  const catColor = Colors.category[spot.category] || Colors.primary;
  const statusColor = spot.isOutdated
    ? Colors.outdated
    : spot.verified
    ? Colors.verified
    : Colors.unverified;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.catIcon, { backgroundColor: catColor + "20" }]}>
          <Ionicons
            name={CATEGORY_ICONS[spot.category] as any}
            size={20}
            color={catColor}
          />
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
            {spot.name}
          </Text>
          <Pressable
            onPress={onToggleFav}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons
              name={isFav ? "star" : "star-outline"}
              size={18}
              color={isFav ? "#F59E0B" : theme.textTertiary}
            />
          </Pressable>
        </View>

        <Text style={[styles.cardAddress, { color: theme.textSecondary }]} numberOfLines={1}>
          {spot.address}
        </Text>

        <View style={styles.cardRow}>
          <View style={styles.ssidRow}>
            <Ionicons name="wifi" size={13} color={Colors.primary} />
            <Text style={[styles.ssidText, { color: Colors.primary }]} numberOfLines={1}>
              {spot.ssid}
            </Text>
          </View>

          {spot.password === "" && (
            <View style={styles.openBadge}>
              <Ionicons name="lock-open-outline" size={11} color={Colors.verified} />
              <Text style={[styles.openText, { color: Colors.verified }]}>{t.list.open}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {spot.isOutdated ? t.map.outdated : spot.verified ? t.map.verified : t.map.unverified}
            </Text>
          </View>

          <SpeedBadge speed={spot.speed} />

          <View style={styles.votesRow}>
            <Ionicons name="thumbs-up" size={12} color={Colors.verified} />
            <Text style={[styles.voteNum, { color: theme.textSecondary }]}>{spot.upvotes}</Text>
            <Ionicons name="thumbs-down" size={12} color={Colors.slow} />
            <Text style={[styles.voteNum, { color: theme.textSecondary }]}>{spot.downvotes}</Text>
          </View>

          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.mapBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="map-outline" size={12} color={Colors.primary} />
            <Text style={[styles.mapBtnText, { color: Colors.primary }]}>
              {formatDistance(dist, distanceUnits)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function ListScreen() {
  const { theme, isDark } = useTheme();
  const { spots, favorites, settings, toggleFavorite, isFavorite } = useWifi();
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const CATEGORY_FILTERS: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: "all",        label: t.categories.all,        icon: "grid-outline"       },
    { key: "cafe",       label: t.categories.cafe,       icon: "cafe-outline"       },
    { key: "restaurant", label: t.categories.restaurant, icon: "restaurant-outline" },
    { key: "bar",        label: t.categories.bar,        icon: "wine-outline"       },
    { key: "hotel",      label: t.categories.hotel,      icon: "bed-outline"        },
    { key: "library",    label: t.categories.library,    icon: "library-outline"    },
    { key: "gym",        label: t.categories.gym,        icon: "barbell-outline"    },
    { key: "mall",       label: t.categories.mall,       icon: "bag-outline"        },
  ];

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const topInset = insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const filtered = useMemo(() => {
    let list = spots;

    if (filterTab === "favorites") {
      list = list.filter((s) => favorites.includes(s.id));
    } else if (filterTab === "verified") {
      list = list.filter((s) => s.verified || s.upvotes >= 5);
    }

    if (categoryFilter !== "all") {
      list = list.filter((s) => s.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.ssid.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    return list;
  }, [spots, favorites, filterTab, categoryFilter, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSpotPress = (id: string) => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/spot/${id}`);
  };

  const handleFavToggle = (id: string) => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 8,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.list.searchPlaceholder}
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filterTabs}>
          {(["all", "favorites", "verified"] as FilterTab[]).map((tab) => {
            const labels = { all: t.list.all, favorites: t.list.favorites, verified: t.list.verified };
            const active = filterTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  if (settings.hapticFeedback) Haptics.selectionAsync();
                  setFilterTab(tab);
                }}
                style={({ pressed }) => [
                  styles.filterTab,
                  {
                    backgroundColor: active ? theme.tint : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: active ? "#fff" : theme.textSecondary },
                  ]}
                >
                  {labels[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {settings.categoryFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat.key;
              const color = cat.key === "all" ? Colors.primary : Colors.category[cat.key as WifiCategory] || Colors.primary;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    if (settings.hapticFeedback) Haptics.selectionAsync();
                    setCategoryFilter(cat.key);
                  }}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? color : theme.surfaceSecondary,
                      borderColor: active ? color : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={12}
                    color={active ? "#fff" : theme.textSecondary}
                  />
                  <Text
                    style={[styles.catLabel, { color: active ? "#fff" : theme.textSecondary }]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 100 + bottomInset },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.tint} />
        }
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            isFav={isFavorite(item.id)}
            theme={theme}
            isDark={isDark}
            distanceUnits={settings.distanceUnits}
            onPress={() => handleSpotPress(item.id)}
            onToggleFav={() => handleFavToggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wifi-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              {search ? t.list.noResults : t.list.noSpots}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
              {search ? t.list.noResultsSub : t.list.noSpotsSub}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => {
          if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add");
        }}
        style={({ pressed }) => [
          styles.fab,
          { opacity: pressed ? 0.85 : 1, bottom: 90 + bottomInset },
        ]}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  catRow: {
    gap: 8,
    paddingBottom: 2,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    paddingTop: 2,
  },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginRight: 8,
  },
  cardAddress: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  ssidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  ssidText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  openText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  speedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  speedText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  votesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteNum: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginRight: 2,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  mapBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
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
});
