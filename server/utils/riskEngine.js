import { districts, roads } from "../data/mockData.js";

import {
  getWeatherForDistricts
} from "../services/weatherService.js";

import {
  getRealRoadRoutes
} from "../services/roadService.js";


// ------------------------------------------------------------
// WEATHER
// ------------------------------------------------------------

/*
 * Convert weather service response into:
 *
 * {
 *   GHY: 35,
 *   DIB: 40,
 *   ...
 * }
 */
function createWeatherSeverityMap(weatherData) {

  const weather = {};

  for (const item of weatherData) {

    if (!item.error) {

      weather[item.districtId] =
        item.severity;

    }

  }

  return weather;

}


// ------------------------------------------------------------
// ROAD RISK
// ------------------------------------------------------------

/*
 * Core road risk calculation.
 *
 * Combines:
 *
 * 1. Terrain exposure
 * 2. Historical incidents
 * 3. REAL weather severity
 *
 * The AI/ML model can later replace
 * this calculation without changing
 * the frontend API structure.
 */
export function computeRoadRisk(
  road,
  weatherByDistrict
) {

  const wFrom =
    weatherByDistrict[road.from] ?? 0;

  const wTo =
    weatherByDistrict[road.to] ?? 0;


  const weatherFactor =
    (wFrom + wTo) / 2;


  const historyFactor =
    Math.min(
      100,
      road.baseIncidents * 2.5
    );


  const score =
    road.terrainRisk * 100 * 0.4 +
    weatherFactor * 0.4 +
    historyFactor * 0.2;


  const risk =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  let status = "open";


  if (risk >= 75) {

    status = "blocked";

  } else if (risk >= 50) {

    status = "high-risk";

  } else if (risk >= 30) {

    status = "caution";

  }


  /*
   * Estimated speed according to
   * current road condition.
   */
  const avgSpeedKmh =
    status === "blocked"
      ? 0
      : status === "high-risk"
      ? 20
      : status === "caution"
      ? 35
      : 50;


  let estimatedDelayMin = null;


  if (status !== "blocked") {

    const normalTime =
      (road.lengthKm / 50) * 60;


    const currentTime =
      (road.lengthKm / avgSpeedKmh) * 60;


    estimatedDelayMin =
      Math.max(
        0,
        Math.round(
          currentTime - normalTime
        )
      );

  }


  return {

    risk,

    status,

    estimatedDelayMin,

    weatherFactor:
      Math.round(weatherFactor),

    historyFactor:
      Math.round(historyFactor)

  };

}


// ------------------------------------------------------------
// NETWORK SNAPSHOT
// ------------------------------------------------------------

/*
 * Get the complete current network snapshot.
 *
 * Weather is obtained from Open-Meteo.
 */
export async function getNetworkSnapshot() {

  /*
   * Get REAL weather.
   */
  const weatherData =
    await getWeatherForDistricts(
      districts
    );


  const weather =
    createWeatherSeverityMap(
      weatherData
    );


  /*
   * Calculate risk for every road.
   */
  const roadStatus =
    roads.map((road) => ({

      ...road,

      ...computeRoadRisk(
        road,
        weather
      )

    }));


  return {

    weather,

    roads: roadStatus,

    weatherDetails:
      weatherData

  };

}


// ------------------------------------------------------------
// OPTIMAL ROUTE
// ------------------------------------------------------------

/*
 * Risk-weighted route planning.
 *
 * The route uses:
 *
 * REAL WEATHER
 *      +
 * ROAD RISK
 *      +
 * REAL OSRM ROAD DISTANCE
 *
 * The frontend does not need to know
 * how the route is calculated.
 */
export async function findOptimalRoute(

  originId,

  destId,

  {
    avoidBlocked = true
  } = {}

) {

  /*
   * Validate districts.
   */
  const origin =
    districts.find(
      (district) =>
        district.id === originId
    );


  const destination =
    districts.find(
      (district) =>
        district.id === destId
    );


  if (!origin || !destination) {

    return {

      found: false,

      reason:
        "Invalid origin or destination district."

    };

  }


  if (originId === destId) {

    return {

      found: true,

      originId,

      destId,

      totalKm: 0,

      totalDurationMin: 0,

      avgRisk: 0,

      estimatedExtraDelayMin: 0,

      geometry: null,

      segments: []

    };

  }


  /*
   * Get current weather and risk.
   */
  const snapshot =
    await getNetworkSnapshot();


  let roadStatus =
    snapshot.roads;


  /*
   * Get REAL OSRM routes for
   * the monitored road network.
   *
   * roadService caches these results,
   * so repeated route requests do not
   * continuously hit OSRM.
   */
  const realRoutes =
    await getRealRoadRoutes(
      roadStatus,
      districts
    );


  /*
   * Attach real routing information
   * to every road.
   */
  roadStatus =
    roadStatus.map((road) => {

      const realRoute =
        realRoutes.find(
          (route) =>
            route.roadId === road.id
        );


      return {

        ...road,

        realDistanceKm:
          realRoute?.error
            ? null
            : realRoute?.distanceKm ?? null,

        realDurationMin:
          realRoute?.error
            ? null
            : realRoute?.durationMin ?? null,

        geometry:
          realRoute?.error
            ? null
            : realRoute?.geometry ?? null,

        routingSource:
          realRoute?.error
            ? null
            : realRoute?.source ?? null

      };

    });


  /*
   * Build graph.
   */
  const adjacency =
    new Map();


  for (const district of districts) {

    adjacency.set(
      district.id,
      []
    );

  }


  /*
   * Add every usable road
   * to the graph.
   */
  for (const road of roadStatus) {

    if (
      avoidBlocked &&
      road.status === "blocked"
    ) {

      continue;

    }


    /*
     * Prefer REAL OSRM distance.
     *
     * If real routing failed,
     * fall back to the existing
     * road distance.
     */
    const distanceKm =
      road.realDistanceKm ??
      road.lengthKm;


    /*
     * Risk penalty.
     *
     * Higher risk makes a road
     * less attractive.
     */
    const riskPenalty =
      1 + road.risk / 40;


    /*
     * Final route weight.
     *
     * Distance is the primary factor.
     * Risk increases the effective cost.
     */
    const weight =
      distanceKm * riskPenalty;


    adjacency
      .get(road.from)
      ?.push({

        to: road.to,

        weight,

        road

      });


    /*
     * Roads are treated as
     * bidirectional.
     */
    adjacency
      .get(road.to)
      ?.push({

        to: road.from,

        weight,

        road

      });

  }


  // ----------------------------------------------------------
  // DIJKSTRA
  // ----------------------------------------------------------

  const dist =
    new Map(
      districts.map(
        (district) => [
          district.id,
          Infinity
        ]
      )
    );


  const prev =
    new Map();


  const visited =
    new Set();


  dist.set(
    originId,
    0
  );


  while (
    visited.size <
    districts.length
  ) {

    let u = null;

    let best =
      Infinity;


    /*
     * Find unvisited node
     * with lowest cost.
     */
    for (
      const [
        id,
        distance
      ] of dist
    ) {

      if (
        !visited.has(id) &&
        distance < best
      ) {

        best =
          distance;

        u =
          id;

      }

    }


    /*
     * No more reachable nodes.
     */
    if (u === null) {

      break;

    }


    visited.add(u);


    /*
     * Destination reached.
     */
    if (u === destId) {

      break;

    }


    /*
     * Relax neighbouring roads.
     */
    for (
      const edge of
        adjacency.get(u) ?? []
    ) {

      const alt =
        dist.get(u) +
        edge.weight;


      if (
        alt <
        dist.get(edge.to)
      ) {

        dist.set(
          edge.to,
          alt
        );


        prev.set(
          edge.to,
          {

            from: u,

            road: edge.road

          }
        );

      }

    }

  }


  /*
   * No route found.
   */
  if (
    dist.get(destId) ===
    Infinity
  ) {

    return {

      found: false,

      originId,

      destId,

      reason:
        "No accessible route found under current conditions."

    };

  }


  // ----------------------------------------------------------
  // RECONSTRUCT ROUTE
  // ----------------------------------------------------------

  const path = [];


  let cur =
    destId;


  while (
    cur !== originId
  ) {

    const step =
      prev.get(cur);


    if (!step) {

      break;

    }


    path.unshift(
      step.road
    );


    cur =
      step.from;

  }


  /*
   * Safety check.
   */
  if (
    path.length === 0
  ) {

    return {

      found: false,

      originId,

      destId,

      reason:
        "Unable to reconstruct the calculated route."

    };

  }


  // ----------------------------------------------------------
  // REAL DISTANCE
  // ----------------------------------------------------------

  /*
   * Calculate total distance using
   * REAL OSRM distances whenever
   * available.
   */
  const totalKm =
    path.reduce(
      (
        sum,
        road
      ) => {

        return (
          sum +
          (
            road.realDistanceKm ??
            road.lengthKm
          )
        );

      },
      0
    );


  const roundedTotalKm =
    Number(
      totalKm.toFixed(2)
    );


  // ----------------------------------------------------------
  // REAL DURATION
  // ----------------------------------------------------------

  /*
   * OSRM provides actual estimated
   * driving duration.
   */
  const totalDurationMin =
    path.reduce(
      (
        sum,
        road
      ) => {

        if (
          road.realDurationMin != null
        ) {

          return (
            sum +
            road.realDurationMin
          );

        }


        /*
         * Fallback if OSRM data
         * is temporarily unavailable.
         */
        if (
          road.status ===
          "blocked"
        ) {

          return sum;

        }


        const speed =
          road.status ===
          "high-risk"
            ? 20
            : road.status ===
              "caution"
            ? 35
            : 50;


        return (
          sum +
          Math.round(
            (
              road.lengthKm /
              speed
            ) *
            60
          )
        );

      },
      0
    );


  // ----------------------------------------------------------
  // RISK
  // ----------------------------------------------------------

  /*
   * Distance-weighted average risk.
   *
   * A long risky road therefore
   * contributes more than a very
   * short risky road.
   */
  const weightedRisk =
    path.reduce(
      (
        sum,
        road
      ) => {

        const distance =
          road.realDistanceKm ??
          road.lengthKm;


        return (
          sum +
          road.risk *
          distance
        );

      },
      0
    );


  const riskDistance =
    path.reduce(
      (
        sum,
        road
      ) => {

        return (
          sum +
          (
            road.realDistanceKm ??
            road.lengthKm
          )
        );

      },
      0
    );


  const avgRisk =
    Math.round(
      weightedRisk /
      (riskDistance || 1)
    );


  // ----------------------------------------------------------
  // DELAY
  // ----------------------------------------------------------

  /*
   * Calculate extra delay from
   * current road conditions.
   */
  const totalDelayMin =
    path.reduce(
      (
        sum,
        road
      ) => {

        if (
          road.status ===
          "blocked"
        ) {

          return sum;

        }


        /*
         * If OSRM gives a real
         * duration, compare it
         * against a 50 km/h baseline.
         */
        if (
          road.realDurationMin != null
        ) {

          const distance =
            road.realDistanceKm ??
            road.lengthKm;


          const normalTime =
            (
              distance /
              50
            ) *
            60;


          return (
            sum +
            Math.max(
              0,
              road.realDurationMin -
              normalTime
            )
          );

        }


        return (
          sum +
          (
            road.estimatedDelayMin ??
            0
          )
        );

      },
      0
    );


  const estimatedExtraDelayMin =
    Math.round(
      Math.max(
        0,
        totalDelayMin
      )
    );


  // ----------------------------------------------------------
  // ROUTE GEOMETRY
  // ----------------------------------------------------------

  /*
   * Return every segment's
   * real geometry.
   *
   * The frontend can later use
   * this to highlight the complete
   * recommended route.
   */
  const geometry =
    path
      .filter(
        (road) =>
          road.geometry?.coordinates
            ?.length > 1
      )
      .map(
        (road) =>
          road.geometry
      );


  // ----------------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------------

  return {

    found: true,

    originId,

    destId,

    totalKm:
      roundedTotalKm,

    totalDurationMin:

      Math.round(
        totalDurationMin
      ),

    avgRisk,

    estimatedExtraDelayMin,

    routingSource:
      "OpenStreetMap / OSRM",

    geometry,

    segments:
      path.map(
        (road) => ({

          roadId:
            road.id,

          name:
            road.name,

          from:
            road.from,

          to:
            road.to,

          fromName:
            districts.find(
              (district) =>
                district.id ===
                road.from
            )?.name,

          toName:
            districts.find(
              (district) =>
                district.id ===
                road.to
            )?.name,

          /*
           * REAL distance
           */
          lengthKm:
            road.realDistanceKm ??
            road.lengthKm,

          /*
           * REAL driving duration
           */
          durationMin:
            road.realDurationMin ??
            null,

          risk:
            road.risk,

          status:
            road.status,

          estimatedDelayMin:
            road.estimatedDelayMin,

          weatherFactor:
            road.weatherFactor,

          historyFactor:
            road.historyFactor,

          routingSource:
            road.routingSource ??
            null,

          geometry:
            road.geometry ??
            null

        })
      )

  };

}