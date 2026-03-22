import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi } from "@/context/WifiContext";
import Colors from "@/constants/colors";

type ThemeOption = "system" | "light" | "dark" | "oled";

const THEME_OPTIONS: { key: ThemeOption; label: string; icon: string }[] = [
  { key: "system", label: "Системная", icon: "phone-portrait-outline" },
  { key: "light", label: "Светлая", icon: "sunny-outline" },
  { key: "dark", label: "Тёмная", icon: "moon-outline" },
  { key: "oled", label: "OLED", icon: "contrast-outline" },
];

function SettingRow({
  label,
  subtitle,
  icon,
  iconColor,
  theme,
  right,
}: {
  label: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  theme: typeof Colors.light;
  right: React.ReactNode;
}) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: theme.separator }]}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + "20" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

function SectionHeader({ title, theme }: { title: string; theme: typeof Colors.light }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.textTertiary }]}>{title}</Text>
  );
}

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const { settings, stats, updateSettings } = useWifi();
  const insets = useSafeAreaInsets();

  const topInset = insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const toggle = (key: keyof typeof settings) => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ [key]: !settings[key] });
  };

  const switchColors = {
    trackColor: { false: isDark ? "#3A3A3C" : "#E5E7EB", true: Colors.primary + "AA" },
    thumbColor: settings.hapticFeedback ? Colors.primary : isDark ? "#636366" : "#fff",
    ios_backgroundColor: isDark ? "#3A3A3C" : "#E5E7EB",
  };

  const statItems = [
    { label: "Точек добавлено", value: stats.spotsAdded, icon: "wifi", color: Colors.primary },
    { label: "Голосов отдано", value: stats.votesCast, icon: "thumbs-up", color: Colors.verified },
    { label: "Репортов", value: stats.reportsFiled, icon: "flag", color: Colors.outdated },
    { label: "Тестов скорости", value: stats.speedTests, icon: "speedometer", color: Colors.fast },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Настройки</Text>
        <View style={[styles.logoContainer, { backgroundColor: Colors.primary + "20" }]}>
          <Ionicons name="wifi" size={24} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomInset }}
      >
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SectionHeader title="ВНЕШНИЙ ВИД" theme={theme} />
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    if (settings.hapticFeedback) Haptics.selectionAsync();
                    updateSettings({ theme: opt.key });
                  }}
                  style={({ pressed }) => [
                    styles.themeBtn,
                    {
                      backgroundColor: active ? Colors.primary : theme.surfaceSecondary,
                      borderColor: active ? Colors.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={active ? "#fff" : theme.textSecondary}
                  />
                  <Text style={[styles.themeBtnLabel, { color: active ? "#fff" : theme.textSecondary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SectionHeader title="КАРТА" theme={theme} />

          <SettingRow
            label="Только проверенные"
            subtitle="Показывать точки с 5+ голосами"
            icon="shield-checkmark-outline"
            iconColor={Colors.verified}
            theme={theme}
            right={
              <Switch
                value={settings.verifiedOnly}
                onValueChange={() => toggle("verifiedOnly")}
                trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: Colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? "#3A3A3C" : "#E5E7EB"}
              />
            }
          />

          <SettingRow
            label="Единицы расстояния"
            subtitle="Километры или мили"
            icon="swap-horizontal-outline"
            iconColor={Colors.primary}
            theme={theme}
            right={
              <View style={styles.unitToggle}>
                {(["km", "mi"] as const).map((u) => {
                  const active = settings.distanceUnits === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => {
                        if (settings.hapticFeedback) Haptics.selectionAsync();
                        updateSettings({ distanceUnits: u });
                      }}
                      style={[
                        styles.unitBtn,
                        {
                          backgroundColor: active ? Colors.primary : theme.surfaceSecondary,
                        },
                      ]}
                    >
                      <Text style={[styles.unitBtnText, { color: active ? "#fff" : theme.textSecondary }]}>
                        {u}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
          />

          <SettingRow
            label="Авто-открытие Wi-Fi"
            subtitle="Показывать детали при переходе с карты"
            icon="map-outline"
            iconColor="#8B5CF6"
            theme={theme}
            right={
              <Switch
                value={settings.autoOpenWifiInfo}
                onValueChange={() => toggle("autoOpenWifiInfo")}
                trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: Colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? "#3A3A3C" : "#E5E7EB"}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SectionHeader title="ОБЩИЕ" theme={theme} />

          <SettingRow
            label="Тактильный отклик"
            subtitle="Вибрация при нажатиях"
            icon="notifications-outline"
            iconColor="#F59E0B"
            theme={theme}
            right={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={() => toggle("hapticFeedback")}
                trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: Colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? "#3A3A3C" : "#E5E7EB"}
              />
            }
          />

          <SettingRow
            label="Фильтр категорий"
            subtitle="Показывать чипы на карте и в списке"
            icon="options-outline"
            iconColor="#EC4899"
            theme={theme}
            right={
              <Switch
                value={settings.categoryFilter}
                onValueChange={() => toggle("categoryFilter")}
                trackColor={{ false: isDark ? "#3A3A3C" : "#E5E7EB", true: Colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? "#3A3A3C" : "#E5E7EB"}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statsHeader}>
            <SectionHeader title="МОИ ВКЛАДЫ" theme={theme} />
          </View>
          <View style={styles.statsGrid}>
            {statItems.map((item) => (
              <View
                key={item.label}
                style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}
              >
                <Ionicons name={item.icon as any} size={22} color={item.color} />
                <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.aboutSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="wifi" size={28} color={Colors.primary} />
          <Text style={[styles.aboutTitle, { color: theme.text }]}>Wi-Fi Калуга</Text>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            Краудсорсинговое приложение для поиска Wi-Fi точек в Калуге.
            Никаких данных не собирается. Делитесь паролями, помогайте сообществу.
          </Text>
          <Text style={[styles.versionText, { color: theme.textTertiary }]}>
            Версия 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    paddingTop: 14,
    paddingBottom: 10,
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  themeBtn: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  themeBtnLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  aboutSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  aboutText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
