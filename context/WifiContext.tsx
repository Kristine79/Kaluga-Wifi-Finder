import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WifiCategory = "cafe" | "restaurant" | "bar" | "hotel" | "library" | "gym" | "mall" | "other";
export type WifiSpeed = "slow" | "moderate" | "fast" | "ultra_fast";
export type AppTheme = "system" | "light" | "dark" | "oled";

export interface WifiSpot {
  id: string;
  name: string;
  address: string;
  ssid: string;
  password: string;
  category: WifiCategory;
  lat: number;
  lng: number;
  upvotes: number;
  downvotes: number;
  verified: boolean;
  speed: WifiSpeed;
  createdAt: string;
  isOutdated: boolean;
  userVote: "up" | "down" | null;
  isUserAdded: boolean;
}

export interface AppSettings {
  theme: AppTheme;
  distanceUnits: "km" | "mi";
  verifiedOnly: boolean;
  autoOpenWifiInfo: boolean;
  hapticFeedback: boolean;
  categoryFilter: boolean;
}

export interface UserStats {
  spotsAdded: number;
  votesCast: number;
  reportsFiled: number;
  speedTests: number;
}

const SEED_SPOTS: WifiSpot[] = [
  {
    id: "seed_1",
    name: "McDonald's Калуга",
    address: "ул. Кирова, 1, Калуга",
    ssid: "McDonalds Free WiFi",
    password: "",
    category: "restaurant",
    lat: 54.5160,
    lng: 36.2573,
    upvotes: 14,
    downvotes: 1,
    verified: true,
    speed: "moderate",
    createdAt: "2025-11-15T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_2",
    name: "Кофейня «Кофе Хауз»",
    address: "пр-т Ленина, 73, Калуга",
    ssid: "KofeHaus_WiFi",
    password: "coffee2024",
    category: "cafe",
    lat: 54.5234,
    lng: 36.2614,
    upvotes: 22,
    downvotes: 2,
    verified: true,
    speed: "fast",
    createdAt: "2025-10-08T09:30:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_3",
    name: "Библиотека им. Белинского",
    address: "ул. Луначарского, 4, Калуга",
    ssid: "Library_Kaluga",
    password: "biblio123",
    category: "library",
    lat: 54.5312,
    lng: 36.2701,
    upvotes: 31,
    downvotes: 0,
    verified: true,
    speed: "fast",
    createdAt: "2025-09-20T14:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_4",
    name: "Ресторан «Пиноккио»",
    address: "ул. Театральная, 18, Калуга",
    ssid: "Pinoccio_Guest",
    password: "pinocchio",
    category: "restaurant",
    lat: 54.5198,
    lng: 36.2689,
    upvotes: 9,
    downvotes: 3,
    verified: false,
    speed: "moderate",
    createdAt: "2025-12-01T12:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_5",
    name: "KFC Калуга",
    address: "ул. Кирова, 12, Калуга",
    ssid: "KFC Free WiFi",
    password: "",
    category: "restaurant",
    lat: 54.5148,
    lng: 36.2601,
    upvotes: 18,
    downvotes: 1,
    verified: true,
    speed: "moderate",
    createdAt: "2025-08-14T11:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_6",
    name: "Отель «Калуга»",
    address: "ул. Кирова, 1Б, Калуга",
    ssid: "Hotel_Kaluga",
    password: "hotel2025",
    category: "hotel",
    lat: 54.5276,
    lng: 36.2643,
    upvotes: 7,
    downvotes: 2,
    verified: true,
    speed: "fast",
    createdAt: "2025-07-22T08:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_7",
    name: "ТЦ «Плаза»",
    address: "ул. Московская, 237, Калуга",
    ssid: "Plaza_WiFi",
    password: "plaza1234",
    category: "mall",
    lat: 54.5238,
    lng: 36.2788,
    upvotes: 25,
    downvotes: 5,
    verified: true,
    speed: "fast",
    createdAt: "2025-06-10T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_8",
    name: "Кафе «Уют»",
    address: "ул. Суворова, 7, Калуга",
    ssid: "Uyut_Free",
    password: "uyut2024",
    category: "cafe",
    lat: 54.5289,
    lng: 36.2720,
    upvotes: 12,
    downvotes: 1,
    verified: true,
    speed: "moderate",
    createdAt: "2025-11-05T15:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_9",
    name: "Бар «Алиби»",
    address: "ул. Дзержинского, 34, Калуга",
    ssid: "Alibi_Bar",
    password: "alibi777",
    category: "bar",
    lat: 54.5217,
    lng: 36.2657,
    upvotes: 6,
    downvotes: 4,
    verified: false,
    speed: "slow",
    createdAt: "2025-10-18T20:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_10",
    name: "Кофейня «Бариста»",
    address: "пл. Старый Торг, 2, Калуга",
    ssid: "Barista_WiFi",
    password: "coffee123",
    category: "cafe",
    lat: 54.5157,
    lng: 36.2565,
    upvotes: 19,
    downvotes: 0,
    verified: true,
    speed: "ultra_fast",
    createdAt: "2025-09-01T09:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_11",
    name: "Областная научная библиотека",
    address: "ул. Ленина, 101, Калуга",
    ssid: "ONB_Kaluga",
    password: "library2024",
    category: "library",
    lat: 54.5304,
    lng: 36.2690,
    upvotes: 28,
    downvotes: 1,
    verified: true,
    speed: "fast",
    createdAt: "2025-05-12T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_12",
    name: "Гипермаркет «Лента»",
    address: "ул. Азаровская, 11, Калуга",
    ssid: "Lenta_Free",
    password: "",
    category: "mall",
    lat: 54.5125,
    lng: 36.2528,
    upvotes: 11,
    downvotes: 2,
    verified: true,
    speed: "moderate",
    createdAt: "2025-04-30T11:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_13",
    name: "Пицца «Додо»",
    address: "ул. Московская, 178, Калуга",
    ssid: "Dodo_WiFi",
    password: "dodo2025",
    category: "restaurant",
    lat: 54.5245,
    lng: 36.2702,
    upvotes: 15,
    downvotes: 2,
    verified: true,
    speed: "fast",
    createdAt: "2025-03-20T12:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_14",
    name: "Отель «Центральный»",
    address: "пл. Победы, 1, Калуга",
    ssid: "Central_Hotel",
    password: "central99",
    category: "hotel",
    lat: 54.5265,
    lng: 36.2673,
    upvotes: 8,
    downvotes: 3,
    verified: false,
    speed: "moderate",
    createdAt: "2025-02-14T14:00:00Z",
    isOutdated: true,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_15",
    name: "Фитнес-клуб «Атлет»",
    address: "ул. Октябрьская, 45, Калуга",
    ssid: "Athlet_Gym",
    password: "fitness2024",
    category: "gym",
    lat: 54.5193,
    lng: 36.2730,
    upvotes: 5,
    downvotes: 1,
    verified: false,
    speed: "fast",
    createdAt: "2025-01-08T08:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  distanceUnits: "km",
  verifiedOnly: false,
  autoOpenWifiInfo: true,
  hapticFeedback: true,
  categoryFilter: true,
};

const DEFAULT_STATS: UserStats = {
  spotsAdded: 0,
  votesCast: 0,
  reportsFiled: 0,
  speedTests: 0,
};

const STORAGE_KEYS = {
  SPOTS: "@wifi_spots",
  FAVORITES: "@wifi_favorites",
  SETTINGS: "@wifi_settings",
  STATS: "@wifi_stats",
};

interface WifiContextValue {
  spots: WifiSpot[];
  favorites: string[];
  settings: AppSettings;
  stats: UserStats;
  isLoading: boolean;
  addSpot: (spot: Omit<WifiSpot, "id" | "upvotes" | "downvotes" | "verified" | "createdAt" | "isOutdated" | "userVote" | "isUserAdded">) => Promise<void>;
  voteSpot: (id: string, vote: "up" | "down") => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  reportSpot: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  isFavorite: (id: string) => boolean;
  getSpotById: (id: string) => WifiSpot | undefined;
}

const WifiContext = createContext<WifiContextValue | null>(null);

export function WifiProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState<WifiSpot[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [spotsJson, favJson, settingsJson, statsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SPOTS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
      ]);

      setSpots(spotsJson ? JSON.parse(spotsJson) : SEED_SPOTS);
      setFavorites(favJson ? JSON.parse(favJson) : []);
      setSettings(settingsJson ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) } : DEFAULT_SETTINGS);
      setStats(statsJson ? JSON.parse(statsJson) : DEFAULT_STATS);
    } catch (e) {
      setSpots(SEED_SPOTS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSpots = useCallback(async (newSpots: WifiSpot[]) => {
    setSpots(newSpots);
    await AsyncStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(newSpots));
  }, []);

  const saveFavorites = useCallback(async (newFavs: string[]) => {
    setFavorites(newFavs);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavs));
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  const saveStats = useCallback(async (newStats: UserStats) => {
    setStats(newStats);
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  }, []);

  const addSpot = useCallback(async (spotData: Omit<WifiSpot, "id" | "upvotes" | "downvotes" | "verified" | "createdAt" | "isOutdated" | "userVote" | "isUserAdded">) => {
    const newSpot: WifiSpot = {
      ...spotData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      upvotes: 0,
      downvotes: 0,
      verified: false,
      createdAt: new Date().toISOString(),
      isOutdated: false,
      userVote: null,
      isUserAdded: true,
    };
    const newSpots = [newSpot, ...spots];
    await saveSpots(newSpots);
    const newStats = { ...stats, spotsAdded: stats.spotsAdded + 1 };
    await saveStats(newStats);
  }, [spots, stats, saveSpots, saveStats]);

  const voteSpot = useCallback(async (id: string, vote: "up" | "down") => {
    const newSpots = spots.map((s) => {
      if (s.id !== id) return s;
      let upvotes = s.upvotes;
      let downvotes = s.downvotes;
      let userVote: "up" | "down" | null = vote;

      if (s.userVote === vote) {
        if (vote === "up") upvotes = Math.max(0, upvotes - 1);
        else downvotes = Math.max(0, downvotes - 1);
        userVote = null;
      } else {
        if (s.userVote === "up") upvotes = Math.max(0, upvotes - 1);
        if (s.userVote === "down") downvotes = Math.max(0, downvotes - 1);
        if (vote === "up") upvotes++;
        else downvotes++;
      }

      const verified = upvotes >= 5;
      return { ...s, upvotes, downvotes, userVote, verified };
    });
    await saveSpots(newSpots);
    const newStats = { ...stats, votesCast: stats.votesCast + 1 };
    await saveStats(newStats);
  }, [spots, stats, saveSpots, saveStats]);

  const toggleFavorite = useCallback(async (id: string) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    await saveFavorites(newFavs);
  }, [favorites, saveFavorites]);

  const reportSpot = useCallback(async (id: string) => {
    const newSpots = spots.map((s) =>
      s.id === id ? { ...s, isOutdated: true } : s
    );
    await saveSpots(newSpots);
    const newStats = { ...stats, reportsFiled: stats.reportsFiled + 1 };
    await saveStats(newStats);
  }, [spots, stats, saveSpots, saveStats]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    await saveSettings(merged);
  }, [settings, saveSettings]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const getSpotById = useCallback((id: string) => spots.find((s) => s.id === id), [spots]);

  const value = useMemo<WifiContextValue>(() => ({
    spots,
    favorites,
    settings,
    stats,
    isLoading,
    addSpot,
    voteSpot,
    toggleFavorite,
    reportSpot,
    updateSettings,
    isFavorite,
    getSpotById,
  }), [spots, favorites, settings, stats, isLoading, addSpot, voteSpot, toggleFavorite, reportSpot, updateSettings, isFavorite, getSpotById]);

  return <WifiContext.Provider value={value}>{children}</WifiContext.Provider>;
}

export function useWifi() {
  const ctx = useContext(WifiContext);
  if (!ctx) throw new Error("useWifi must be used within WifiProvider");
  return ctx;
}
