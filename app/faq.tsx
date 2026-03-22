import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function FaqItem({
  q,
  a,
  theme,
  isLast,
}: {
  q: string;
  a: string;
  theme: ReturnType<typeof useTheme>["theme"];
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.item,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.question, { color: theme.text }]}>{q}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textTertiary}
          style={styles.chevron}
        />
      </View>
      {open && (
        <Text style={[styles.answer, { color: theme.textSecondary }]}>{a}</Text>
      )}
    </Pressable>
  );
}

export default function FaqScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: theme.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="faq-back"
        >
          <Ionicons name="chevron-down" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t.faq.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + bottomInset }}
      >
        {t.faq.sections.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {section.items.map((item, idx) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  theme={theme}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.footer, { borderColor: theme.border }]}>
          <Ionicons name="wifi" size={20} color={Colors.primary} />
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            Wi-Fi Калуга · v1.0.0
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  chevron: {
    marginTop: 3,
  },
  answer: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
