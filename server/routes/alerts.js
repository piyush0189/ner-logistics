import { Router } from "express";
import { districts } from "../data/mockData.js";
import { getNetworkSnapshot } from "../utils/riskEngine.js";

const router = Router();


// Build alerts from the CURRENT network risk
export async function buildAlerts() {
  const snapshot = await getNetworkSnapshot();

  const alerts = [];

  for (const road of snapshot.roads) {
    if (road.status === "blocked") {
      alerts.push({
        id: `road-${road.id}-blocked`,
        type: "road-blocked",
        severity: "critical",
        title: "Road Blocked",
        message: `${road.name} is currently blocked due to high risk conditions.`,
        roadId: road.id,
        createdAt: new Date().toISOString()
      });
    } else if (road.status === "high-risk") {
      alerts.push({
        id: `road-${road.id}-risk`,
        type: "high-risk-road",
        severity: "high",
        title: "High Risk Road",
        message: `${road.name} has high logistics risk under current conditions.`,
        roadId: road.id,
        createdAt: new Date().toISOString()
      });
    } else if (road.status === "caution") {
      alerts.push({
        id: `road-${road.id}-caution`,
        type: "road-caution",
        severity: "medium",
        title: "Road Caution",
        message: `${road.name} requires caution under current conditions.`,
        roadId: road.id,
        createdAt: new Date().toISOString()
      });
    }
  }


  // Create weather alerts from REAL Open-Meteo data
  for (const weather of snapshot.weatherDetails) {

    if (weather.error) {
      continue;
    }


    if (weather.severity >= 75) {

      alerts.push({
        id: `weather-${weather.districtId}-critical`,
        type: "weather",
        severity: "critical",
        title: "Severe Weather",
        message: `${weather.name} is experiencing ${weather.condition}.`,
        districtId: weather.districtId,
        createdAt: new Date().toISOString()
      });

    } else if (weather.severity >= 50) {

      alerts.push({
        id: `weather-${weather.districtId}-high`,
        type: "weather",
        severity: "high",
        title: "Severe Weather",
        message: `${weather.name} is experiencing ${weather.condition}.`,
        districtId: weather.districtId,
        createdAt: new Date().toISOString()
      });

    } else if (weather.severity >= 30) {

      alerts.push({
        id: `weather-${weather.districtId}-medium`,
        type: "weather",
        severity: "medium",
        title: "Weather Alert",
        message: `${weather.name} is experiencing ${weather.condition}.`,
        districtId: weather.districtId,
        createdAt: new Date().toISOString()
      });
    }
  }


  return alerts;
}


// GET /api/alerts
router.get("/", async (req, res) => {

  try {

    const alerts =
      await buildAlerts();


    res.json({
      alerts
    });

  } catch (error) {

    console.error(
      "Alerts API error:",
      error
    );


    res.status(500).json({
      error: "Unable to load alerts",
      message: error.message
    });
  }
});


export default router;