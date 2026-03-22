import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const SLIDES = [
  {
    icon: "map" as const,
    title: "Всё на одной карте",
    sub: "Найдите Wi-Fi рядом с вами",
  },
  {
    icon: "wifi" as const,
    title: "Бесплатный интернет",
    sub: "Кафе, рестораны, библиотеки",
  },
  {
    icon: "key-outline" as const,
    title: "Пароли под рукой",
    sub: "Копируйте одним нажатием",
  },
  {
    icon: "people-outline" as const,
    title: "Проверено сообществом",
    sub: "Голосуйте за точность данных",
  },
];

export function AppPreloader() {
  const [slide, setSlide] = useState(0);
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        setSlide((s) => (s + 1) % SLIDES.length);
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }).start();
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const current = SLIDES[slide];

  return (
    <LinearGradient
      colors={["#0052CC", "#0065FF", "#1A7FFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoPulse }] }]}>
        <View style={styles.logoInner}>
          <Ionicons name="wifi" size={40} color="#fff" />
        </View>
      </Animated.View>

      <Text style={styles.appName}>Wi-Fi Калуга</Text>
      <Text style={styles.appSub}>Калужская область</Text>

      <Animated.View style={[styles.slideWrap, { opacity: slideOpacity }]}>
        <View style={styles.iconBox}>
          <Ionicons name={current.icon} size={38} color="#fff" />
        </View>
        <Text style={styles.slideTitle}>{current.title}</Text>
        <Text style={styles.slideSub}>{current.sub}</Text>
      </Animated.View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === slide ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  logoWrap: {
    marginBottom: 20,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "System" : undefined,
  },
  appSub: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
    marginBottom: 48,
  },
  slideWrap: {
    alignItems: "center",
    gap: 12,
    minHeight: 130,
  },
  iconBox: {
    width: 82,
    height: 82,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  slideSub: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 7,
    marginTop: 36,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
