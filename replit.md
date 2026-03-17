# Wi-Fi Калуга

Краудсорсинговое PWA-приложение для поиска Wi-Fi точек в Калуге. Expo (React Native Web) + Express backend + Telegram бот.

## Architecture

- **Frontend**: Expo Router (React Native Web), TypeScript, PWA
- **Backend**: Express.js (port 5000) — API + landing page + Telegram bot
- **Dev server**: Expo Metro (port 8081)
- **State**: AsyncStorage (client), in-memory array (server)
- **Maps**: Leaflet.js (web), react-native-maps@1.18.0 (native)
- **Telegram**: node-telegram-bot-api (polling mode)

## Key Features

- Interactive Leaflet map with colored markers (verified/unverified/outdated)
- Searchable list with category and status filters
- Add new Wi-Fi spots with SSID, password, category, speed
- Vote (upvote/downvote) on spot accuracy
- Favorites system, report outdated info
- Settings: theme (system/light/dark/OLED), distance units
- Contribution stats tracking
- 15 pre-seeded Kaluga locations
- PWA: installable, offline support via service worker
- Telegram bot with commands: /поиск, /список, /кафе, /рестораны, /библиотеки, /тц, /отели, /спорт, /проверенные

## File Structure

```
app/
  _layout.tsx            — Root layout (WifiProvider, QueryClient, ErrorBoundary)
  (tabs)/
    _layout.tsx          — Tab bar (NativeTabs iOS 26+, classic tabs otherwise)
    index.tsx            — Map screen
    list.tsx             — List screen (search + filters + FAB)
    settings.tsx         — Settings + contribution stats
  add.tsx                — Add Wi-Fi spot (formSheet)
  spot/[id].tsx          — Spot detail (formSheet) copy/vote/report
components/
  WifiMap.tsx            — Web Leaflet map (PWA)
  WifiMap.native.tsx     — Native map (react-native-maps, iOS/Android)
  ErrorBoundary.tsx      — Error boundary
context/
  WifiContext.tsx        — App state (spots, favorites, settings, stats)
hooks/
  useTheme.ts            — Theme hook + haversine distance utilities
constants/
  colors.ts              — Color palette
server/
  index.ts               — Express server setup + Telegram bot init
  routes.ts              — REST API (/api/spots, /api/stats, voting, reporting)
  telegram.ts            — Telegram bot handler
  spots-data.ts          — Shared WiFi spot data (15 Kaluga spots)
web/
  index.html             — PWA HTML template (manifest, Leaflet CSS, SW registration)
  manifest.json          — PWA web manifest
  sw.js                  — Service worker (offline cache)
```

## API Endpoints

- `GET /api/spots` — list spots (query: category, verified, q)
- `GET /api/spots/:id` — single spot
- `POST /api/spots` — add spot
- `POST /api/spots/:id/vote` — vote (body: { vote: "up"|"down" })
- `POST /api/spots/:id/report` — report outdated
- `GET /api/stats` — total/verified counts by category

## Environment Variables

- `TELEGRAM_BOT_TOKEN` — (secret) Telegram bot token from @BotFather
- `SESSION_SECRET` — session secret
- `PORT` — server port (default 5000)
- `EXPO_PUBLIC_DOMAIN` — injected at build time

## Design

- Primary blue: #0065FF, verified green: #00C48C, outdated amber: #F59E0B
- Font: Inter (400/500/600/700)
- Themes: light / dark / OLED / system
- Leaflet dark tiles: CartoDB Dark Matter; light: OpenStreetMap
