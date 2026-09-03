import { Router } from "express";
import {
  vehicles,
  roads,
  districts
} from "../data/mockData.js";

import {
  getNetworkSnapshot
} from "../utils/riskEngine.js";

const router = Router();

function interpolate(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];
}


// Get live vehicle positions
export async function getLiveVehicles() {

  const {
    roads: roadStatus
  } = await getNetworkSnapshot();


  return vehicles.map((v) => {

    const road = roads.find(
      (r) => r.id === v.roadId
    );

    if (!road) {
      return {
        ...v,
        error: "Road not found"
      };
    }


    const roadRisk = roadStatus.find(
      (r) => r.id === v.roadId
    );


    const from = districts.find(
      (d) => d.id === road.from
    );

    const to = districts.find(
      (d) => d.id === road.to
    );


    if (!from || !to) {
      return {
        ...v,
        roadName: road.name,
        error: "District coordinates not found"
      };
    }


    const t =
      v.direction === "forward"
        ? v.progress
        : 1 - v.progress;


    const [lat, lng] = interpolate(
      [from.lat, from.lng],
      [to.lat, to.lng],
      t
    );


    const remainingKm =
      road.lengthKm * (1 - v.progress);


    const speedKmh =
      roadRisk?.status === "blocked"
        ? 0
        : roadRisk?.status === "high-risk"
          ? 20
          : roadRisk?.status === "caution"
            ? 35
            : 50;


    const etaMin =
      speedKmh > 0
        ? Math.round(
            (remainingKm / speedKmh) * 60
          )
        : null;


    return {
      ...v,

      roadName: road.name,

      lat,
      lng,

      originName: from.name,

      destName: to.name,

      currentRoadStatus:
        roadRisk?.status,

      currentRoadRisk:
        roadRisk?.risk,

      etaMin
    };
  });
}


// GET /api/vehicles
router.get("/", async (req, res) => {

  try {

    const liveVehicles =
      await getLiveVehicles();


    res.json({
      vehicles: liveVehicles
    });

  } catch (error) {

    console.error(
      "Vehicle API error:",
      error
    );


    res.status(500).json({
      error: "Unable to load vehicle data",
      message: error.message
    });
  }
});


// GET /api/vehicles/:id
router.get("/:id", async (req, res) => {

  try {

    const liveVehicles =
      await getLiveVehicles();


    const vehicle =
      liveVehicles.find(
        (x) => x.id === req.params.id
      );


    if (!vehicle) {
      return res.status(404).json({
        error: "Vehicle not found"
      });
    }


    res.json(vehicle);

  } catch (error) {

    console.error(
      "Vehicle API error:",
      error
    );


    res.status(500).json({
      error: "Unable to load vehicle",
      message: error.message
    });
  }
});


export default router;