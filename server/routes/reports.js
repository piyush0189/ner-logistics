import { Router } from "express";
import { nanoid } from "nanoid";
import { fieldReports } from "../data/mockData.js";

const router = Router();

// GET /api/reports - all field-submitted geo-tagged reports
router.get("/", (req, res) => {
  res.json({ reports: [...fieldReports].sort((a, b) => b.timestamp - a.timestamp) });
});

// POST /api/reports - submit a new geo-tagged incident report from the field.
// Accepts a clientTimestamp so reports queued offline and synced later
// preserve the time they were actually captured.
router.post("/", (req, res) => {
  const { roadId, districtId, officer, note, lat, lng, severity, clientTimestamp } = req.body;
  if (!officer || !note || lat == null || lng == null) {
    return res.status(400).json({ error: "officer, note, lat and lng are required" });
  }
  const report = {
    id: `FR-${nanoid(6)}`,
    roadId: roadId || null,
    districtId: districtId || null,
    officer,
    note,
    lat,
    lng,
    severity: severity || "medium",
    timestamp: clientTimestamp || Date.now(),
    synced: true,
  };
  fieldReports.push(report);
  res.status(201).json(report);
});

export default router;
