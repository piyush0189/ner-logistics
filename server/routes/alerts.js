import { Router } from "express";
import { getNetworkSnapshot } from "../utils/riskEngine.js";
import { vehicles, fieldReports } from "../data/mockData.js";

const router = Router();

function buildAlerts() {
  const { roads } = getNetworkSnapshot();
  const alerts = [];

  for (const r of roads) {
    if (r.status === "blocked") {
      alerts.push({
        id: `AL-${r.id}-blocked`,
        type: "blocked-road",
        severity: "critical",
        roadId: r.id,
        message: `${r.name} (${r.from}–${r.to}) is impassable. Predicted risk score ${r.risk}/100.`,
        timestamp: Date.now(),
      });
    } else if (r.status === "high-risk") {
      alerts.push({
        id: `AL-${r.id}-highrisk`,
        type: "high-risk-corridor",
        severity: "warning",
        roadId: r.id,
        message: `${r.name} (${r.from}–${r.to}) flagged as high-risk corridor. Risk score ${r.risk}/100, expect delays.`,
        timestamp: Date.now(),
      });
    }
  }

  for (const v of vehicles) {
    if (v.status === "delayed") {
      alerts.push({
        id: `AL-${v.id}-delayed`,
        type: "delayed-delivery",
        severity: "warning",
        vehicleId: v.id,
        message: `${v.id} carrying ${v.cargo} is delayed on route ${v.originId} → ${v.destId}.`,
        timestamp: Date.now(),
      });
    }
  }

  for (const fr of fieldReports) {
    if (fr.severity === "high") {
      alerts.push({
        id: `AL-${fr.id}`,
        type: "field-report",
        severity: "critical",
        roadId: fr.roadId,
        message: `Field report from ${fr.officer}: ${fr.note}`,
        timestamp: fr.timestamp,
      });
    }
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

// GET /api/alerts - live alert feed
router.get("/", (req, res) => {
  res.json({ alerts: buildAlerts() });
});

export { buildAlerts };
export default router;
