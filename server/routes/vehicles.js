import { Router } from "express";
import { vehicles, roads, districts } from "../data/mockData.js";
import { getNetworkSnapshot } from "../utils/riskEngine.js";

const router = Router();

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function getLiveVehicles() {
  const { roads: roadStatus } = getNetworkSnapshot();
  return vehicles.map((v) => {
    const road = roads.find((r) => r.id === v.roadId);
    const roadRisk = roadStatus.find((r) => r.id === v.roadId);
    const from = districts.find((d) => d.id === road.from);
    const to = districts.find((d) => d.id === road.to);
    const t = v.direction === "forward" ? v.progress : 1 - v.progress;
    const [lat, lng] = interpolate([from.lat, from.lng], [to.lat, to.lng], t);

    const remainingKm = road.lengthKm * (1 - v.progress);
    const speedKmh = roadRisk?.status === "blocked" ? 0 : roadRisk?.status === "high-risk" ? 20 : roadRisk?.status === "caution" ? 35 : 50;
    const etaMin = speedKmh > 0 ? Math.round((remainingKm / speedKmh) * 60) : null;

    return {
      ...v,
      roadName: road.name,
      lat,
      lng,
      originName: from.name,
      destName: to.name,
      currentRoadStatus: roadRisk?.status,
      currentRoadRisk: roadRisk?.risk,
      etaMin,
    };
  });
}

// GET /api/vehicles - live positions of tracked vehicles
router.get("/", (req, res) => {
  res.json({ vehicles: getLiveVehicles() });
});

router.get("/:id", (req, res) => {
  const v = getLiveVehicles().find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  res.json(v);
});

export default router;
