import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

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
  // Real Kaluga spots
  {
    id: "seed_16",
    name: "Бургер Кинг Калуга",
    address: "ул. Московская, 85, Калуга",
    ssid: "BurgerKing_FREE",
    password: "",
    category: "restaurant",
    lat: 54.5139,
    lng: 36.2625,
    upvotes: 21,
    downvotes: 1,
    verified: true,
    speed: "moderate",
    createdAt: "2025-06-01T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_17",
    name: "ТЦ «РИО»",
    address: "Тульское шоссе, 2, Калуга",
    ssid: "RIO_WiFi",
    password: "",
    category: "mall",
    lat: 54.5076,
    lng: 36.2387,
    upvotes: 34,
    downvotes: 4,
    verified: true,
    speed: "fast",
    createdAt: "2025-04-12T09:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_18",
    name: "ТЦ «Калуга»",
    address: "ул. Кирова, 37, Калуга",
    ssid: "TC_Kaluga_Free",
    password: "",
    category: "mall",
    lat: 54.5168,
    lng: 36.2609,
    upvotes: 19,
    downvotes: 2,
    verified: true,
    speed: "moderate",
    createdAt: "2025-03-05T11:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_19",
    name: "Кофейня «Шоколадница»",
    address: "ул. Кирова, 44, Калуга",
    ssid: "Shokoladnitsa",
    password: "choco123",
    category: "cafe",
    lat: 54.5175,
    lng: 36.2618,
    upvotes: 27,
    downvotes: 0,
    verified: true,
    speed: "fast",
    createdAt: "2025-05-20T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_20",
    name: "КГУ им. Циолковского",
    address: "ул. Степана Разина, 26, Калуга",
    ssid: "KSU_Student",
    password: "kgu2025",
    category: "library",
    lat: 54.5342,
    lng: 36.2496,
    upvotes: 45,
    downvotes: 3,
    verified: true,
    speed: "ultra_fast",
    createdAt: "2025-02-01T08:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_21",
    name: "Гостиница «Балчуг»",
    address: "ул. Кирова, 2, Калуга",
    ssid: "Balchug_Hotel",
    password: "balchug2025",
    category: "hotel",
    lat: 54.5161,
    lng: 36.2568,
    upvotes: 11,
    downvotes: 1,
    verified: true,
    speed: "fast",
    createdAt: "2025-01-20T14:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_22",
    name: "Додо Пицца на Ленина",
    address: "пр-т Ленина, 36, Калуга",
    ssid: "Dodo_Lenin",
    password: "",
    category: "restaurant",
    lat: 54.5228,
    lng: 36.2598,
    upvotes: 16,
    downvotes: 0,
    verified: true,
    speed: "moderate",
    createdAt: "2025-07-10T12:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_23",
    name: "Кафе «Поляна»",
    address: "ул. Суворова, 119, Калуга",
    ssid: "Polyana_Cafe",
    password: "polyana1",
    category: "cafe",
    lat: 54.5310,
    lng: 36.2755,
    upvotes: 8,
    downvotes: 2,
    verified: false,
    speed: "moderate",
    createdAt: "2025-08-22T11:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_24",
    name: "Старбакс Калуга (Galeria)",
    address: "пр-т Ленина, 55, Калуга",
    ssid: "Starbucks",
    password: "",
    category: "cafe",
    lat: 54.5252,
    lng: 36.2628,
    upvotes: 38,
    downvotes: 2,
    verified: true,
    speed: "fast",
    createdAt: "2024-11-11T09:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_25",
    name: "МФЦ Калуга",
    address: "ул. Вилонова, 4, Калуга",
    ssid: "MFC_Free_WiFi",
    password: "",
    category: "other",
    lat: 54.5186,
    lng: 36.2531,
    upvotes: 23,
    downvotes: 5,
    verified: true,
    speed: "slow",
    createdAt: "2025-09-01T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_26",
    name: "Калужский областной театр",
    address: "пл. Театральная, 1, Калуга",
    ssid: "Theatre_Kaluga",
    password: "teatr2025",
    category: "other",
    lat: 54.5207,
    lng: 36.2672,
    upvotes: 7,
    downvotes: 1,
    verified: false,
    speed: "moderate",
    createdAt: "2025-04-30T14:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_27",
    name: "Пятёрочка Московская",
    address: "ул. Московская, 174, Калуга",
    ssid: "5ka_Guest",
    password: "",
    category: "mall",
    lat: 54.5239,
    lng: 36.2694,
    upvotes: 4,
    downvotes: 6,
    verified: false,
    speed: "slow",
    createdAt: "2025-11-20T15:00:00Z",
    isOutdated: true,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_28",
    name: "Ресторан «Речной вокзал»",
    address: "ул. Московская, 2, Калуга",
    ssid: "RechVokzal_WiFi",
    password: "river2025",
    category: "restaurant",
    lat: 54.5129,
    lng: 36.2583,
    upvotes: 12,
    downvotes: 3,
    verified: true,
    speed: "moderate",
    createdAt: "2025-06-15T18:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_29",
    name: "Гостиница «Приокская»",
    address: "ул. Приокская, 1, Калуга",
    ssid: "Priokskaya_Hotel",
    password: "hotel321",
    category: "hotel",
    lat: 54.5094,
    lng: 36.2702,
    upvotes: 9,
    downvotes: 0,
    verified: true,
    speed: "fast",
    createdAt: "2025-03-28T10:00:00Z",
    isOutdated: false,
    userVote: null,
    isUserAdded: false,
  },
  {
    id: "seed_30",
    name: "ТЦ «Европа»",
    address: "ул. Академика Королёва, 6, Калуга",
    ssid: "Europa_Free",
    password: "",
    category: "mall",
    lat: 54.5448,
    lng: 36.2368,
    upvotes: 17,
    downvotes: 2,
    verified: true,
    speed: "moderate",
    createdAt: "2025-07-04T11:00:00Z",
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

      const localSpots: WifiSpot[] = spotsJson ? JSON.parse(spotsJson) : SEED_SPOTS;
      setFavorites(favJson ? JSON.parse(favJson) : []);
      setSettings(settingsJson ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) } : DEFAULT_SETTINGS);
      setStats(statsJson ? JSON.parse(statsJson) : DEFAULT_STATS);

      // Show local spots immediately, then merge OSM on top
      setSpots(localSpots);

      // Fetch real OSM spots from backend in background
      try {
        const apiBase = getApiUrl();
        const osmUrl = new URL("/api/osm-spots", apiBase).toString();
        const resp = await fetch(osmUrl, { signal: AbortSignal.timeout(12000) });
        if (resp.ok) {
          const osmSpots: WifiSpot[] = await resp.json();
          // Merge: keep local spots, add OSM spots that don't conflict
          const localIds = new Set(localSpots.map(s => s.id));
          const newOsm = osmSpots
            .filter(s => !localIds.has(s.id))
            .map(s => ({ ...s, userVote: null as "up" | "down" | null, isUserAdded: false }));
          if (newOsm.length > 0) {
            setSpots([...localSpots, ...newOsm]);
          }
        }
      } catch {
        // OSM unavailable — that's fine, we still show local spots
      }
    } catch (e) {
      setSpots(SEED_SPOTS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSpots = useCallback(async (newSpots: WifiSpot[]) => {
    setSpots(newSpots);
    // Only persist local spots (not OSM), OSM are re-fetched on load
    const localOnly = newSpots.filter(s => !s.id.startsWith("osm_"));
    await AsyncStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(localOnly));
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
