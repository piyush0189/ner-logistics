import { Router } from "express";

import {
  districts
} from "../data/mockData.js";

import {
  getNetworkSnapshot
} from "../utils/riskEngine.js";


const router = Router();


/*
 * GET /api/districts
 *
 * Returns district-wise:
 * - coordinates
 * - weather severity
 * - connectivity status
 * - worst connected-road risk
 * - number of connected roads
 */
router.get("/", async (req, res) => {

  try {

    const snapshot =
      await getNetworkSnapshot();


    const {
      roads: roadStatus,
      weather
    } = snapshot;


    const result =
      districts.map((district) => {

        const connectedRoads =
          roadStatus.filter(
            (road) =>
              road.from === district.id ||
              road.to === district.id
          );


        const worstRoadRisk =
          connectedRoads.reduce(
            (highest, road) =>
              road.risk > highest
                ? road.risk
                : highest,
            0
          );


        let connectivity =
          "connected";


        if (
          connectedRoads.length === 0
        ) {

          connectivity =
            "isolated";

        } else if (
          connectedRoads.every(
            (road) =>
              road.status === "blocked"
          )
        ) {

          connectivity =
            "cut-off";

        } else if (
          connectedRoads.some(
            (road) =>
              road.status === "blocked" ||
              road.status === "high-risk"
          )
        ) {

          connectivity =
            "at-risk";

        }


        return {

          ...district,

          weatherSeverity:
            weather[district.id] ?? 0,

          connectivity,

          worstRoadRisk,

          connectedRoadCount:
            connectedRoads.length

        };

      });


    res.json({

      count:
        result.length,

      districts:
        result

    });

  } catch (error) {

    console.error(
      "District API error:",
      error
    );


    res.status(500).json({

      error:
        "Unable to load district data",

      message:
        error.message

    });

  }

});


/*
 * GET /api/districts/:id
 *
 * Returns one district with its
 * current connected-road information.
 */
router.get("/:id", async (req, res) => {

  try {

    const district =
      districts.find(
        (item) =>
          item.id === req.params.id
      );


    if (!district) {

      return res.status(404).json({

        error:
          "District not found"

      });

    }


    const snapshot =
      await getNetworkSnapshot();


    const {
      roads: roadStatus,
      weather
    } = snapshot;


    const connectedRoads =
      roadStatus.filter(
        (road) =>
          road.from === district.id ||
          road.to === district.id
      );


    const worstRoadRisk =
      connectedRoads.reduce(
        (highest, road) =>
          road.risk > highest
            ? road.risk
            : highest,
        0
      );


    let connectivity =
      "connected";


    if (
      connectedRoads.length === 0
    ) {

      connectivity =
        "isolated";

    } else if (
      connectedRoads.every(
        (road) =>
          road.status === "blocked"
      )
    ) {

      connectivity =
        "cut-off";

    } else if (
      connectedRoads.some(
        (road) =>
          road.status === "blocked" ||
          road.status === "high-risk"
      )
    ) {

      connectivity =
        "at-risk";

    }


    res.json({

      ...district,

      weatherSeverity:
        weather[district.id] ?? 0,

      connectivity,

      worstRoadRisk,

      connectedRoadCount:
        connectedRoads.length,

      connectedRoads

    });

  } catch (error) {

    console.error(
      "District API error:",
      error
    );


    res.status(500).json({

      error:
        "Unable to load district",

      message:
        error.message

    });

  }

});


export default router;