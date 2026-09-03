import { Router } from "express";
import { getWeatherSeverity } from "../utils/riskEngine.js";
import { districts } from "../data/mockData.js";

const router = Router();

// GET /api/weather - district-wise weather severity (0-100).
// In production this proxies IMD / a weather provider API instead of simulating.
router.get("/", (req, res) => {
  const severity = getWeatherSeverity();
  const result = districts.map((d) => ({
    districtId: d.id,
    name: d.name,
    severity: severity[d.id],
    condition: severity[d.id] > 70 ? "Heavy rainfall" : severity[d.id] > 40 ? "Moderate rain" : "Clear",
  }));
  res.json({ districts: result });
});

export default router;
