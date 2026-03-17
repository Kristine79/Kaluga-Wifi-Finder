import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { SEED_SPOTS, WifiSpot } from "./spots-data";

let spots: WifiSpot[] = [...SEED_SPOTS];

// ─── OSM real spots cache ────────────────────────────────────────────────────
let osmCache: WifiSpot[] | null = null;
let osmCacheTime = 0;
const OSM_TTL_MS = 60 * 60 * 1000; // 1 hour

const AMENITY_CATEGORY: Record<string, WifiSpot["category"]> = {
  cafe: "cafe",
  restaurant: "restaurant",
  bar: "bar",
  pub: "bar",
  fast_food: "restaurant",
  food_court: "restaurant",
  hotel: "hotel",
  hostel: "hotel",
  motel: "hotel",
  library: "library",
  college: "library",
  university: "library",
  marketplace: "mall",
  mall: "mall",
  cinema: "mall",
  theatre: "mall",
  fitness_centre: "gym",
  gym: "gym",
};

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

async function fetchOsmSpots(): Promise<WifiSpot[]> {
  // Kaluga bounding box: south,west,north,east
  const bbox = "54.40,36.10,54.65,36.45";
  const query =
    `[out:json][timeout:25];` +
    `(` +
    `node["internet_access"](${bbox});` +
    `way["internet_access"](${bbox});` +
    `relation["internet_access"](${bbox});` +
    `);` +
    `out center;`;

  let lastError: Error = new Error("No mirrors available");
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const resp = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) { lastError = new Error(`Overpass ${resp.status}`); continue; }
      const text = await resp.text();
      if (text.trimStart().startsWith("<")) { lastError = new Error("Overpass returned HTML error"); continue; }
      const data = JSON.parse(text) as { elements: any[] };
      return parseOsmElements(data.elements);
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError;
}

function parseOsmElements(elements: any[]): WifiSpot[] {
  const seen = new Set<string>();
  const result: WifiSpot[] = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags["name:ru"] || tags["name:en"];
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;

    const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const amenity: string = tags.amenity || tags.tourism || tags.leisure || tags.shop || "other";
    const category: WifiSpot["category"] = AMENITY_CATEGORY[amenity] || "other";

    const street = tags["addr:street"] || "";
    const house = tags["addr:housenumber"] || "";
    const address = street
      ? `${street}${house ? ", " + house : ""}, Калуга`
      : "Калуга";

    const ssid: string = tags["internet_access:ssid"] || tags["wifi:ssid"] || "";
    const fee: string = tags["internet_access:fee"] || tags["fee"] || "no";
    const isFree = fee === "no" || fee === "free" || fee === "";

    result.push({
      id: `osm_${el.id}`,
      name,
      address,
      ssid: ssid || (isFree ? "Free WiFi" : "Спросите у персонала"),
      password: tags["internet_access:password"] || tags["wifi:password"] || "",
      category,
      lat,
      lng,
      upvotes: 3,
      downvotes: 0,
      verified: true,
      speed: "moderate",
      createdAt: new Date().toISOString(),
      isOutdated: false,
    });
  }

  return result;
}

async function getOsmSpots(): Promise<WifiSpot[]> {
  if (osmCache && Date.now() - osmCacheTime < OSM_TTL_MS) return osmCache;
  try {
    osmCache = await fetchOsmSpots();
    osmCacheTime = Date.now();
    console.log(`[OSM] Loaded ${osmCache.length} real Wi-Fi spots in Kaluga`);
  } catch (err) {
    console.warn("[OSM] Failed to fetch spots:", err);
    osmCache = osmCache ?? [];
  }
  return osmCache;
}

export function getSpots() {
  return spots;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Warm up OSM cache in background on startup
  getOsmSpots().catch(() => {});

  app.get("/api/osm-spots", async (_req: Request, res: Response) => {
    try {
      const osm = await getOsmSpots();
      res.json(osm);
    } catch (err) {
      res.status(503).json({ error: "OSM unavailable", spots: [] });
    }
  });

  app.get("/api/spots", (req: Request, res: Response) => {
    const { category, verified, q } = req.query;
    let filtered = spots;

    if (category && typeof category === "string") {
      filtered = filtered.filter(s => s.category === category);
    }
    if (verified === "true") {
      filtered = filtered.filter(s => s.verified && !s.isOutdated);
    }
    if (q && typeof q === "string") {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query) ||
          s.ssid.toLowerCase().includes(query)
      );
    }

    res.json(filtered);
  });

  app.get("/api/spots/:id", (req: Request, res: Response) => {
    const spot = spots.find(s => s.id === req.params.id);
    if (!spot) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(spot);
  });

  app.post("/api/spots", (req: Request, res: Response) => {
    const { name, address, ssid, password, category, lat, lng, speed } = req.body;

    if (!name || !address || !ssid || !category || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing required fields: name, address, ssid, category, lat, lng" });
    }

    const newSpot: WifiSpot = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: String(name).trim(),
      address: String(address).trim(),
      ssid: String(ssid).trim(),
      password: password ? String(password).trim() : "",
      category,
      lat: Number(lat),
      lng: Number(lng),
      upvotes: 0,
      downvotes: 0,
      verified: false,
      speed: speed || "moderate",
      createdAt: new Date().toISOString(),
      isOutdated: false,
    };

    spots.unshift(newSpot);
    res.status(201).json(newSpot);
  });

  app.post("/api/spots/:id/vote", (req: Request, res: Response) => {
    const { vote } = req.body;
    if (!["up", "down"].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be "up" or "down"' });
    }

    const idx = spots.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Not found" });
    }

    const spot = { ...spots[idx] };
    if (vote === "up") spot.upvotes++;
    else spot.downvotes++;
    if (spot.upvotes >= 5) spot.verified = true;

    spots[idx] = spot;
    res.json(spot);
  });

  app.post("/api/spots/:id/report", (req: Request, res: Response) => {
    const idx = spots.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Not found" });
    }
    spots[idx] = { ...spots[idx], isOutdated: true };
    res.json(spots[idx]);
  });

  app.get("/api/stats", (_req: Request, res: Response) => {
    const total = spots.length;
    const verified = spots.filter(s => s.verified && !s.isOutdated).length;
    const categories = spots.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    res.json({ total, verified, categories });
  });

  const httpServer = createServer(app);
  return httpServer;
}
