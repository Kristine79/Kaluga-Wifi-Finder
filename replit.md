# Wi-Fi Калуга

A crowdsourced mobile app for finding Wi-Fi hotspots in Kaluga, Russia. Built with Expo (React Native) + Express backend.

## Architecture

- **Frontend**: Expo Router (React Native), TypeScript
- **Backend**: Express.js (port 5000) — serves API + landing page
- **State**: AsyncStorage for all local persistence (no database)
- **Maps**: react-native-maps@1.18.0 (Expo Go compatible)

## Key Features

- Interactive map with Wi-Fi spot markers (verified/unverified/outdated)
- Searchable list with category and status filters
- Add new Wi-Fi spots with SSID, password, category, speed
- Vote (upvote/downvote) on spot accuracy
- Favorites system
- Report outdated info
- Settings: theme (system/light/dark/OLED), distance units, filters
- Contribution stats tracking
- 15 pre-seeded Kaluga locations

## File Structure

```
app/
  _layout.tsx          — Root layout with providers (WifiProvider, QueryClient)
  (tabs)/
    _layout.tsx        — Tab bar (NativeTabs on iOS 26+, classic tabs otherwise)
    index.tsx          — Map screen with MapView + markers
    list.tsx           — List screen with search + category filters
    settings.tsx       — Settings + contribution stats
  add.tsx              — Add Wi-Fi spot (formSheet)
  spot/[id].tsx        — Spot detail (formSheet) with copy/vote/report
context/
  WifiContext.tsx      — Main app state (spots, favorites, settings, stats)
hooks/
  useTheme.ts          — Theme hook + distance utilities
constants/
  colors.ts            — Color palette
```

## Dependencies Added

- `react-native-maps@1.18.0` — Interactive map (Expo Go compatible, no plugins entry)
- `expo-clipboard` — Copy SSID/password to clipboard

## Design

- Color palette: primary blue #0065FF, verified green #00C48C, outdated amber #F59E0B
- Font: Inter (400/500/600/700)
- Supports light/dark/OLED themes
