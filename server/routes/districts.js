import { Router } from "express";
import { districts, roads } from "../data/mockData.js";
import { getNetworkSnapshot } from "../utils/riskEngine.js";

const router = Router();

// GET /api/districts - district-wise connectivity status
router.get("/", (req, res) => {
  const { roads: roadStatus, weather } = getNetworkSnapshot();

  const result = districts.map((d) => {
    const connectedRoads = roadStatus.filter((r) => r.from === d.id || r.to === d.id);
    const worst = connectedRoads.reduce(
      (acc, r) => (r.risk > acc ? r.risk : acc),
      0
    );
    let connectivity = "connected";
    if (connectedRoads.length === 0) connectivity = "isolated";
    else if (connectedRoads.every((r) => r.status === "blocked")) connectivity = "cut-off";
    else if (connectedRoads.some((r) => r.status === "blocked" || r.status === "high-risk")) connectivity = "at-risk";

    return {
      ...d,
      weatherSeverity: weather[d.id],
      connectivity,
      worstRoadRisk: worst,
      connectedRoadCount: connectedRoads.length,
    };
  });

  res.json({ count: result.length, districts: result });
});

router.get("/:id", (req, res) => {
  const d = districts.find((x) => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: "District not found" });
  const { roads: roadStatus, weather } = getNetworkSnapshot();
  const connectedRoads = roadStatus.filter((r) => r.from === d.id || r.to === d.id);
  res.json({ ...d, weatherSeverity: weather[d.id], connectedRoads });
});

export default router;
