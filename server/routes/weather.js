import { Router } from "express";
import { districts } from "../data/mockData.js";
import { getWeatherForDistricts } from "../services/weatherService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const weatherData = await getWeatherForDistricts(districts);

    res.json({
      source: "Open-Meteo",
      count: weatherData.length,
      districts: weatherData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(500).json({
      error: "Unable to fetch weather data",
      message: error.message
    });
  }
});

export default router;