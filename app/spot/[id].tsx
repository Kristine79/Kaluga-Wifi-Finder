import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi, WifiSpot } from "@/context/WifiContext";
import Colors from "@/constants/colors";

const CATEGORY_ICONS: Record<string, string> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "wine",
  hotel: "bed",
  library: "library",
  gym: "barbell",
  mall: "bag",
  other: "wifi",
};

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "Кафе",
  restaurant: "Ресторан",
  bar: "Бар",
  hotel: "Отель",
  library: "Библиотека",
  gym: "Спортзал",
  mall: "Торговый центр",
  other: "Другое",
};

const SPEED_LABELS: Record<string, string> = {
  slow: "Медленный",
  moderate: "Средний",
  fast: "Быстрый",
  ultra_fast: "Ультра быстрый",
};

const SPEED_COLORS: Record<string, string> = {
  slow: Colors.slow,
  moderate: Colors.moderate,
  fast: Colors.fast,
  ultra_fast: Colors.ultraFast,
};

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const { getSpotById, voteSpot, toggleFavorite, reportSpot, isFavorite, settings } = useWifi();
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedSsid, setCopiedSsid] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const spot = getSpotById(id ?? "");

  if (!spot) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="wifi-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Точка не найдена
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>
              Назад
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const fav = isFavorite(spot.id);
  const catColor = Colors.category[spot.category as keyof typeof Colors.category] || Colors.primary;
  const statusColor = spot.isOutdated
    ? Colors.outdated
    : spot.verified
    ? Colors.verified
    : Colors.unverified;
  const speedColor = SPEED_COLORS[spot.speed] || Colors.moderate;

  const handleCopySsid = async () => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(spot.ssid);
    setCopiedSsid(true);
    setTimeout(() => setCopiedSsid(false), 2000);
  };

  const handleCopyPass = async () => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(spot.password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleVote = (vote: "up" | "down") => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voteSpot(spot.id, vote);
  };

  const handleFav = () => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(spot.id);
  };

  const handleReport = () => {
    Alert.alert(
      "Отметить как устаревшее",
      "Вы хотите сообщить, что информация об этой точке устарела?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Да, сообщить",
          style: "destructive",
          onPress: () => {
            if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            reportSpot(spot.id);
            router.back();
          },
        },
      ]
    );
  };

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.catIconHeader, { backgroundColor: catColor + "20" }]}>
          <Ionicons name={CATEGORY_ICONS[spot.category] as any} size={22} color={catColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.spotName, { color: theme.text }]} numberOfLines={1}>
            {spot.name}
          </Text>
          <Text style={[styles.spotCategory, { color: catColor }]}>
            {CATEGORY_LABELS[spot.category] || "Другое"}
          </Text>
        </View>
        <Pressable
          onPress={handleFav}
          style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons
            name={fav ? "star" : "star-outline"}
            size={22}
            color={fav ? "#F59E0B" : theme.textTertiary}
          />
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={22} color={theme.textTertiary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.textTertiary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{spot.address}</Text>
          </View>
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {spot.isOutdated ? "Устарело" : spot.verified ? "Проверено" : "Не проверено"}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: speedColor + "22" }]}>
            <Ionicons name="flash-outline" size={13} color={speedColor} />
            <Text style={[styles.badgeText, { color: speedColor }]}>
              {SPEED_LABELS[spot.speed]}
            </Text>
          </View>
        </View>

        <View style={[styles.wifiCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <Text style={[styles.wifiCardTitle, { color: theme.textTertiary }]}>ПОДКЛЮЧЕНИЕ</Text>

          <View style={[styles.wifiRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="wifi" size={18} color={Colors.primary} />
            <View style={styles.wifiRowContent}>
              <Text style={[styles.wifiLabel, { color: theme.textTertiary }]}>Сеть</Text>
              <Text style={[styles.wifiValue, { color: theme.text }]}>{spot.ssid}</Text>
            </View>
            <Pressable
              onPress={handleCopySsid}
              style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.6 : 1, backgroundColor: Colors.primary + "20" }]}
            >
              <Ionicons
                name={copiedSsid ? "checkmark" : "copy-outline"}
                size={16}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.wifiRow}>
            <Ionicons
              name={spot.password ? "lock-closed" : "lock-open"}
              size={18}
              color={spot.password ? theme.textTertiary : Colors.verified}
            />
            <View style={styles.wifiRowContent}>
              <Text style={[styles.wifiLabel, { color: theme.textTertiary }]}>Пароль</Text>
              {spot.password ? (
                <Text style={[styles.wifiValue, { color: theme.text }]}>
                  {showPassword ? spot.password : "••••••••"}
                </Text>
              ) : (
                <Text style={[styles.wifiValue, { color: Colors.verified }]}>
                  Открытая сеть
                </Text>
              )}
            </View>
            {spot.password ? (
              <View style={styles.copyRow}>
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    { opacity: pressed ? 0.6 : 1, backgroundColor: theme.surfaceSecondary },
                  ]}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={16}
                    color={theme.textSecondary}
                  />
                </Pressable>
                <Pressable
                  onPress={handleCopyPass}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    { opacity: pressed ? 0.6 : 1, backgroundColor: Colors.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name={copiedPass ? "checkmark" : "copy-outline"}
                    size={16}
                    color={Colors.primary}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.votingCard, { borderColor: theme.border }]}>
          <Text style={[styles.votingTitle, { color: theme.textTertiary }]}>
            Это работает?
          </Text>
          <View style={styles.votingRow}>
            <Pressable
              onPress={() => handleVote("up")}
              style={({ pressed }) => [
                styles.voteBtn,
                {
                  backgroundColor:
                    spot.userVote === "up" ? Colors.verified + "22" : theme.surfaceSecondary,
                  borderColor: spot.userVote === "up" ? Colors.verified : theme.border,
                  opacity: pressed ? 0.8 : 1,
                  flex: 1,
                },
              ]}
            >
              <Ionicons
                name="thumbs-up"
                size={20}
                color={spot.userVote === "up" ? Colors.verified : theme.textSecondary}
              />
              <Text
                style={[
                  styles.voteBtnText,
                  { color: spot.userVote === "up" ? Colors.verified : theme.text },
                ]}
              >
                {spot.upvotes} Работает
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleVote("down")}
              style={({ pressed }) => [
                styles.voteBtn,
                {
                  backgroundColor:
                    spot.userVote === "down" ? Colors.slow + "22" : theme.surfaceSecondary,
                  borderColor: spot.userVote === "down" ? Colors.slow : theme.border,
                  opacity: pressed ? 0.8 : 1,
                  flex: 1,
                },
              ]}
            >
              <Ionicons
                name="thumbs-down"
                size={20}
                color={spot.userVote === "down" ? Colors.slow : theme.textSecondary}
              />
              <Text
                style={[
                  styles.voteBtnText,
                  { color: spot.userVote === "down" ? Colors.slow : theme.text },
                ]}
              >
                {spot.downvotes} Не работает
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.dateText, { color: theme.textTertiary }]}>
            Добавлено{" "}
            {new Date(spot.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        <Pressable
          onPress={handleReport}
          style={({ pressed }) => [
            styles.reportBtn,
            {
              borderColor: Colors.outdated + "66",
              backgroundColor: Colors.outdated + "11",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="flag-outline" size={16} color={Colors.outdated} />
          <Text style={[styles.reportBtnText, { color: Colors.outdated }]}>
            Сообщить об устаревших данных
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  catIconHeader: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  spotCategory: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  wifiCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  wifiCardTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  wifiRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  wifiRowContent: {
    flex: 1,
    gap: 2,
  },
  wifiLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  wifiValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  copyRow: {
    flexDirection: "row",
    gap: 6,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  votingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  votingTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  votingRow: {
    flexDirection: "row",
    gap: 10,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  voteBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  reportBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  backBtn: {
    marginTop: 8,
  },
});
