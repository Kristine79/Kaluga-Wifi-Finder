import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { SEED_SPOTS, WifiSpot } from "./spots-data";

let spots: WifiSpot[] = [...SEED_SPOTS];

export function getSpots() {
  return spots;
}

export async function registerRoutes(app: Express): Promise<Server> {
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
