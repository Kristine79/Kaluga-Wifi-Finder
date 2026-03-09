import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useWifi, WifiCategory, WifiSpeed } from "@/context/WifiContext";
import Colors from "@/constants/colors";

const CATEGORIES: { key: WifiCategory; label: string; icon: string; color: string }[] = [
  { key: "cafe", label: "Кафе", icon: "cafe-outline", color: Colors.category.cafe },
  { key: "restaurant", label: "Ресторан", icon: "restaurant-outline", color: Colors.category.restaurant },
  { key: "bar", label: "Бар", icon: "wine-outline", color: Colors.category.bar },
  { key: "hotel", label: "Отель", icon: "bed-outline", color: Colors.category.hotel },
  { key: "library", label: "Библиотека", icon: "library-outline", color: Colors.category.library },
  { key: "gym", label: "Спортзал", icon: "barbell-outline", color: Colors.category.gym },
  { key: "mall", label: "ТЦ", icon: "bag-outline", color: Colors.category.mall },
  { key: "other", label: "Другое", icon: "ellipsis-horizontal-outline", color: Colors.category.other },
];

const SPEEDS: { key: WifiSpeed; label: string; sublabel: string; color: string }[] = [
  { key: "slow", label: "Медленный", sublabel: "< 5 Мбит/с", color: Colors.slow },
  { key: "moderate", label: "Средний", sublabel: "5-25 Мбит/с", color: Colors.moderate },
  { key: "fast", label: "Быстрый", sublabel: "25-100 Мбит/с", color: Colors.fast },
  { key: "ultra_fast", label: "Ультра", sublabel: "> 100 Мбит/с", color: Colors.ultraFast },
];

export default function AddSpotScreen() {
  const { theme, isDark } = useTheme();
  const { addSpot, settings } = useWifi();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<WifiCategory>("cafe");
  const [speed, setSpeed] = useState<WifiSpeed>("moderate");
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Ошибка", "Введите название заведения");
      return;
    }
    if (!ssid.trim()) {
      Alert.alert("Ошибка", "Введите название сети (SSID)");
      return;
    }
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    await addSpot({
      name: name.trim(),
      address: address.trim() || "Калуга",
      ssid: ssid.trim(),
      password: isOpen ? "" : password.trim(),
      category,
      speed,
      lat: 54.5293 + (Math.random() - 0.5) * 0.04,
      lng: 36.2754 + (Math.random() - 0.5) * 0.04,
    });

    setSaving(false);
    router.back();
  };

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Добавить Wi-Fi</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: Colors.primary, opacity: pressed || saving ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.saveBtnText}>{saving ? "..." : "Готово"}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ОСНОВНОЕ</Text>

          <View style={[styles.inputRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="storefront-outline" size={18} color={theme.textTertiary} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Название заведения"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
            />
          </View>

          <View style={[styles.inputRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="location-outline" size={18} color={theme.textTertiary} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Адрес (необязательно)"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>WI-FI</Text>

          <View style={[styles.inputRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="wifi-outline" size={18} color={theme.textTertiary} />
            <TextInput
              value={ssid}
              onChangeText={setSsid}
              placeholder="Название сети (SSID)"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              autoCapitalize="none"
            />
          </View>

          <Pressable
            onPress={() => {
              if (settings.hapticFeedback) Haptics.selectionAsync();
              setIsOpen(!isOpen);
            }}
            style={({ pressed }) => [
              styles.inputRow,
              {
                borderBottomColor: theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name={isOpen ? "lock-open-outline" : "lock-closed-outline"}
              size={18}
              color={isOpen ? Colors.verified : theme.textTertiary}
            />
            <Text
              style={[styles.input, { color: isOpen ? Colors.verified : theme.textSecondary }]}
            >
              {isOpen ? "Открытая сеть (без пароля)" : "Есть пароль"}
            </Text>
            <Ionicons
              name={isOpen ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={isOpen ? Colors.verified : theme.textTertiary}
            />
          </Pressable>

          {!isOpen && (
            <View style={[styles.inputRow, { borderBottomColor: "transparent" }]}>
              <Ionicons name="key-outline" size={18} color={theme.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль"
                placeholderTextColor={theme.textTertiary}
                style={[styles.input, { color: theme.text }]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.textTertiary}
                />
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>КАТЕГОРИЯ</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    if (settings.hapticFeedback) Haptics.selectionAsync();
                    setCategory(cat.key);
                  }}
                  style={({ pressed }) => [
                    styles.catBtn,
                    {
                      backgroundColor: active ? cat.color : theme.surfaceSecondary,
                      borderColor: active ? cat.color : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={20} color={active ? "#fff" : theme.textSecondary} />
                  <Text style={[styles.catBtnLabel, { color: active ? "#fff" : theme.textSecondary }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>СКОРОСТЬ</Text>
          <View style={styles.speedList}>
            {SPEEDS.map((s) => {
              const active = speed === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    if (settings.hapticFeedback) Haptics.selectionAsync();
                    setSpeed(s.key);
                  }}
                  style={({ pressed }) => [
                    styles.speedBtn,
                    {
                      backgroundColor: active ? s.color + "22" : "transparent",
                      borderColor: active ? s.color : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.speedDot, { backgroundColor: s.color }]} />
                  <View style={styles.speedBtnText}>
                    <Text style={[styles.speedLabel, { color: theme.text }]}>{s.label}</Text>
                    <Text style={[styles.speedSublabel, { color: theme.textTertiary }]}>
                      {s.sublabel}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={s.color} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
          Данные хранятся только на этом устройстве. Никакой личной информации не собирается.
        </Text>
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
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: "45%",
    flex: 1,
  },
  catBtnLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  speedList: {
    padding: 12,
    gap: 8,
  },
  speedBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  speedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  speedBtnText: {
    flex: 1,
  },
  speedLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  speedSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
