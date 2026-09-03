import { Router } from "express";

import {
  getNetworkSnapshot,
  findOptimalRoute
} from "../utils/riskEngine.js";

import {
  districts
} from "../data/mockData.js";

import {
  getRealRoadRoutes
} from "../services/roadService.js";


const router = Router();


/*
 * GET /api/roads
 *
 * Returns:
 * - Current weather
 * - Current road risk
 * - Road status
 * - Real OpenStreetMap road geometry
 * - Real road distance
 * - Real estimated driving duration
 */
router.get("/", async (req, res) => {

  try {

    // Get current network risk and weather
    const snapshot =
      await getNetworkSnapshot();


    // Get real road routes from
    // OpenStreetMap / OSRM
    const realRoutes =
      await getRealRoadRoutes(
        snapshot.roads,
        districts
      );


    // Combine our risk data with
    // real routing data
    const roads =
      snapshot.roads.map((road) => {

        const from =
          districts.find(
            (district) =>
              district.id === road.from
          );


        const to =
          districts.find(
            (district) =>
              district.id === road.to
          );


        const realRoute =
          realRoutes.find(
            (route) =>
              route.roadId === road.id
          );


        return {

          // Existing road information
          ...road,


          // Starting district coordinates
          fromCoords:
            from
              ? [
                  from.lat,
                  from.lng
                ]
              : null,


          // Destination district coordinates
          toCoords:
            to
              ? [
                  to.lat,
                  to.lng
                ]
              : null,


          // District names
          fromName:
            from?.name,


          toName:
            to?.name,


          /*
           * REAL ROAD INFORMATION
           */

          realDistanceKm:
            realRoute?.error
              ? null
              : realRoute?.distanceKm ?? null,


          realDurationMin:
            realRoute?.error
              ? null
              : realRoute?.durationMin ?? null,


          // GeoJSON road geometry
          geometry:
            realRoute?.error
              ? null
              : realRoute?.geometry ?? null,


          // Routing provider
          routingSource:
            realRoute?.error
              ? null
              : realRoute?.source ?? null,


          // Error message if OSRM failed
          routingError:
            realRoute?.error
              ? realRoute.message
              : null

        };

      });


    /*
     * Send response
     */
    res.json({

      weather:
        snapshot.weather,

      count:
        roads.length,

      roads,

      routingSource:
        "OpenStreetMap / OSRM",

      generatedAt:
        new Date().toISOString()

    });


  } catch (error) {

    console.error(
      "Road API error:",
      error
    );


    res.status(500).json({

      error:
        "Unable to load road network",

      message:
        error.message

    });

  }

});


/*
 * GET /api/roads/route
 *
 * Example:
 *
 * /api/roads/route?from=SIL&to=AIZ
 *
 * Calculates the optimal route
 * between two districts.
 */
router.get("/route", async (req, res) => {

  try {

    const {
      from,
      to
    } = req.query;


    // Validate input
    if (!from || !to) {

      return res.status(400).json({

        error:
          "from and to district ids are required"

      });

    }


    // Calculate optimal route
    const result =
      await findOptimalRoute(
        from,
        to
      );


    res.json(result);


  } catch (error) {

    console.error(
      "Route API error:",
      error
    );


    res.status(500).json({

      error:
        "Unable to calculate route",

      message:
        error.message

    });

  }

});


export default router;