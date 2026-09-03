import { Router } from "express";
import { getNetworkSnapshot, findOptimalRoute } from "../utils/riskEngine.js";
import { districts } from "../data/mockData.js";

const router = Router();

// GET /api/roads - real-time road accessibility across the network
router.get("/", (req, res) => {
  const { roads, weather } = getNetworkSnapshot();
  const withCoords = roads.map((r) => {
    const from = districts.find((d) => d.id === r.from);
    const to = districts.find((d) => d.id === r.to);
    return {
      ...r,
      fromCoords: from ? [from.lat, from.lng] : null,
      toCoords: to ? [to.lat, to.lng] : null,
      fromName: from?.name,
      toName: to?.name,
    };
  });
  res.json({ weather, roads: withCoords });
});

// GET /api/roads/route?from=SIL&to=AIZ - AI-based alternate route suggestion
router.get("/route", (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: "from and to district ids are required" });
  const result = findOptimalRoute(from, to);
  res.json(result);
});

export default router;
